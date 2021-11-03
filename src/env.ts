// This strategy will be used across the application to secure routes
export const API_AUTH_STATEGY = 'API'

export const EMAIL_TOKEN_EXPIRATION_MINUTES = 10

// Load the JWT secret from environment variables or default
export const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_JWT_SECRET'

export const JWT_ALGORITHM = 'HS256'

export const AUTHENTICATION_TOKEN_EXPIRATION_HOURS = 12
