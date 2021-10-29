import Hapi from '@hapi/hapi'
import hapiAuthJWT from 'hapi-auth-jwt2'
import statusPlugin from './plugins/status'
import prismaPlugin from './plugins/prisma'
import usersPlugin from './plugins/users'
import emailPlugin from './plugins/email'
import authPlugin from "./plugins/auth";

const server: Hapi.Server = Hapi.server({
  port: process.env.PORT || 3000,
  host: process.env.HOST || '0.0.0.0',
})

export async function createServer(): Promise<Hapi.Server> {
  await server.register([
    hapiAuthJWT,
    authPlugin,
    statusPlugin,
    prismaPlugin,
    usersPlugin,
    emailPlugin,
  ])
  await server.initialize()

  return server
}

export async function startServer(server: Hapi.Server): Promise<Hapi.Server> {
  await server.start()
  console.log(`Server running on ${server.info.uri}`)
  return server
}

process.on('unhandledRejection', err => {
  console.log(err)
  process.exit(1)
})
