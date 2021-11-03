import Hapi from "@hapi/hapi";
import {APITokenPayload, AuthenticateInput, LoginInput} from "./interfaces";
import {add} from "date-fns";
import {
  AUTHENTICATION_TOKEN_EXPIRATION_HOURS,
  EMAIL_TOKEN_EXPIRATION_MINUTES,
  JWT_ALGORITHM,
  JWT_SECRET
} from "../../env";
import Boom from "@hapi/boom";
import jwt from "jsonwebtoken";
import {apiTokenSchema} from "./schema";
import {createJwtToken, createShortLivedToken, getTokenById, getUserByEmailToken, invalidateToken} from "./model";

// Generate a random 8 digit number as the email token
export function generateEmailToken(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString()
}

// Generate a signed JWT token with the tokenId in the payload
export function generateAuthToken(tokenId: number): string {
  const jwtPayload = { tokenId }

  return jwt.sign(jwtPayload, JWT_SECRET, {
    algorithm: JWT_ALGORITHM,
    noTimestamp: true,
  })
}

export async function loginHandler(request: Hapi.Request, h: Hapi.ResponseToolkit) {
  // 👇 get prisma and the sendEmailToken from shared application state
  const { prisma, sendEmailToken } = request.server.app
  // 👇 get the email from the request payload
  const { email } = request.payload as LoginInput
  // 👇 generate an alphanumeric token
  const emailToken = generateEmailToken()
  // 👇 create a date object for the email token expiration
  const tokenExpiration = add(new Date(), {
    minutes: EMAIL_TOKEN_EXPIRATION_MINUTES,
  })

  try {
    // 👇 create a short lived token and update user or create if they don't exist
    const createToken = await createShortLivedToken(prisma, tokenExpiration, emailToken, email);
    // 👇 send the email token
    if (process.env.NODE_ENV !== 'test') {
      await sendEmailToken(email, emailToken)
    }

    return h.response().code(200)
  } catch (error: any) {
    return Boom.badImplementation(error.message)
  }
}

export async function authenticateHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) {
  // 👇 get prisma from shared application state
  const { prisma } = request.server.app
  // 👇 get the email and emailToken from the request payload
  const { email, emailToken } = request.payload as AuthenticateInput

  try {
    // Get short lived email token
    const fetchedEmailToken = await getUserByEmailToken(prisma, emailToken);

    if (!fetchedEmailToken?.valid) {
      // If the token doesn't exist or is not valid, return 401 unauthorized
      return Boom.unauthorized()
    }

    if (fetchedEmailToken.expiration < new Date()) {
      // If the token has expired, return 401 unauthorized
      return Boom.unauthorized('Token expired')
    }

    // If token matches the user email passed in the payload, generate long lived API token
    if (fetchedEmailToken?.user?.email === email) {
      const tokenExpiration = add(new Date(), {
        hours: AUTHENTICATION_TOKEN_EXPIRATION_HOURS,
      })
      // Persist token in DB so it's stateful
      const createdToken = await createJwtToken(prisma, tokenExpiration, email);

      // Invalidate the email token after it's been used
      await invalidateToken(prisma, fetchedEmailToken.id)

      const authToken = generateAuthToken(createdToken.id)
      return h.response().code(200).header('Authorization', authToken)
    } else {
      return Boom.unauthorized()
    }
  } catch (error: any) {
    return Boom.badImplementation(error.message)
  }
}

// Function will be called on every request using the auth strategy
export const validateAPIToken = async (
  decoded: APITokenPayload,
  request: Hapi.Request,
  h: Hapi.ResponseToolkit,
) => {
  const { prisma } = request.server.app
  const { tokenId } = decoded
  // Validate the token payload adheres to the schema
  const { error } = apiTokenSchema.validate(decoded)

  if (error) {
    request.log(['error', 'auth'], `API token error: ${error.message}`)
    return { isValid: false }
  }

  try {
    // Fetch the token from DB to verify it's valid
    const fetchedToken = await getTokenById(prisma, tokenId);

    // Check if token could be found in database and is valid
    if (!fetchedToken || !fetchedToken?.valid) {
      return { isValid: false, errorMessage: 'Invalid Token' }
    }

    // Check token expiration
    if (fetchedToken.expiration < new Date()) {
      return { isValid: false, errorMessage: 'Token expired' }
    }

    // The token is valid. Make the `userId`, `isAdmin`, and `teacherOf` to `credentials` which is available in route handlers via `request.auth.credentials`
    return {
      isValid: true,
      credentials: {
        tokenId: decoded.tokenId,
        userId: fetchedToken.userId,
        isAdmin: fetchedToken.user.isAdmin,
      },
    }
  } catch (error: any) {
    request.log(['error', 'auth', 'db'], error)
    return { isValid: false }
  }
}
