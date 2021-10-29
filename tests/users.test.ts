import { createServer } from '../src/server'
import Hapi, {AuthCredentials} from '@hapi/hapi'
import {createUserCredentials} from "./test-helpers";

describe('POST /users - create user', () => {
  let server: Hapi.Server
  let testUserCredentials: AuthCredentials

  beforeAll(async () => {
    server = await createServer()
    testUserCredentials = await createUserCredentials(server.app.prisma, false)
  })

  afterAll(async () => {
    await server.stop()
  })

  let userId: any

  test('create user', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'test-name',
        email: `test-${Date.now()}@prisma.io`,
      }
    })

    expect(response.statusCode).toEqual(201)
    userId = JSON.parse(response.payload)?.id
    expect(typeof userId === 'number').toBeTruthy()
  })

  test('create user validation', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        name: 'test-last-name',
        // email: `test-${Date.now()}@prisma.io`,
      },
    })

    console.log(response.payload)
    expect(response.statusCode).toEqual(400)
  })

})
