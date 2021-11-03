import { createServer } from '../src/server'
import Hapi, {AuthCredentials} from '@hapi/hapi'
import {createUserCredentials} from "./test-helpers";
import { TokenType } from '@prisma/client';

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

  test('login user', async () => {

    console.log(testUserCredentials);
    userId = testUserCredentials.userId;

    const user = await server.app.prisma.user.findUnique({
      where: {
        id: userId
      }
    });

    expect(user).not.toBeNull();
    expect(user?.email).not.toBeNull();

    const response = await server.inject({
      method: 'POST',
      url: '/login',
      payload: {
        email: user?.email,
      }
    })

    expect(response.statusCode).toEqual(200)
  });

  test('authentificate user', async () => {

    console.log(testUserCredentials);
    userId = testUserCredentials.userId;

    const token = await server.app.prisma.token.findFirst({
      where: {
        userId: userId,
        tokenType: TokenType.EMAIL,
      },
      include: { user: true }
    });

    const response = await server.inject({
      method: 'POST',
      url: '/authenticate',
      payload: {
        emailToken: token?.emailToken,
        email: token?.user.email,
      }
    })

    expect(response.statusCode).toEqual(200);
    expect(response.headers.authorization).not.toBeNull();
  });

});
