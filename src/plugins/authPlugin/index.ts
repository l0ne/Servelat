import Hapi from '@hapi/hapi'
import {
  API_AUTH_STATEGY,
  JWT_ALGORITHM,
  JWT_SECRET
} from "../../env";
import {authenticateHandler, loginHandler, validateAPIToken} from "./functions";
import {authValidateSchema, loginValidateSchema} from "./schema";

const authPlugin: Hapi.Plugin<null> = {
  name: 'app/auth',
  dependencies: ['prisma', 'hapi-auth-jwt2', 'app/email'],
  register: async function(server: Hapi.Server) {

    if (!process.env.JWT_SECRET) {
      server.log(
        'warn',
        'The JWT_SECRET env var is not set. This is unsafe! If running in production, set it.',
      )
    }

    // Define the authentication strategy which uses the `jwt` authentication scheme
    server.auth.strategy(API_AUTH_STATEGY, 'jwt', {
      key: JWT_SECRET,
      verifyOptions: { algorithms: [JWT_ALGORITHM] },
      validate: validateAPIToken,
    })

    // Set the default authentication strategy for API routes, unless explicitly disabled
    server.auth.default(API_AUTH_STATEGY)

    server.route([
      // Endpoint to login or register and to send the short-lived token
      {
        method: 'POST',
        path: '/login',
        handler: loginHandler,
        options: {
          auth: false,
          validate: {
            payload: loginValidateSchema,
          },
        },
      },
      {
        method: 'POST',
        path: '/authenticate',
        handler: authenticateHandler,
        options: {
          auth: false,
          validate: {
            payload: authValidateSchema,
          },
        },
      }
    ])
  },
}

export default authPlugin
