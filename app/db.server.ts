import { PrismaClient } from '@prisma/client'
import chalk from 'chalk'
import invariant from 'tiny-invariant'

let prisma: PrismaClient

declare global {
  var __db__: PrismaClient
}

if (process.env.NODE_ENV === 'production') {
  prisma = getClient()
} else {
  if (!global.__db__) {
    global.__db__ = getClient()
  }
  prisma = global.__db__
}

function getClient() {
  const { DATABASE_URL } = process.env
  invariant(typeof DATABASE_URL === 'string', 'DATABASE_URL env var not set')

  const databaseUrl = new URL(DATABASE_URL)

  const isLocalHost = databaseUrl.hostname === 'localhost'

  const PRIMARY_REGION = isLocalHost ? null : process.env.PRIMARY_REGION
  const FLY_REGION = isLocalHost ? null : process.env.FLY_REGION

  const isReadReplicaRegion = !PRIMARY_REGION || PRIMARY_REGION === FLY_REGION

  if (!isLocalHost) {
    databaseUrl.host = `${FLY_REGION}.${databaseUrl.host}`
    if (!isReadReplicaRegion) {
      // 5433 is the read-replica port
      databaseUrl.port = '5433'
    }
  }

  console.log(`🔌 setting up prisma client to ${databaseUrl.host}`)
  // NOTE: during development if you change anything in this function, remember
  // that this only runs once per server restart and won't automatically be
  // re-run per request like everything else is. So if you need to change
  // something in this file, you'll need to manually restart the server.
  const client = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'info', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
    datasources: {
      db: {
        url: databaseUrl.toString(),
      },
    },
  })
  // connect eagerly
  client.$connect()
  client.$on('query', (e) => {
    if (e.duration < 50) return

    const color =
      e.duration < 30
        ? 'green'
        : e.duration < 50
        ? 'blue'
        : e.duration < 80
        ? 'yellow'
        : e.duration < 100
        ? 'redBright'
        : 'red'
    const dur = chalk[color](`${e.duration}ms`)
    console.log(`prisma:query - ${dur} - ${e.query}`)
  })

  return client
}

export { prisma }
