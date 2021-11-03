import {TokenType, PrismaClient} from "@prisma/client";

export function createShortLivedToken(
  prisma: PrismaClient,
  tokenExpiration: Date,
  emailToken: string,
  email: string
) {
  return prisma.token.create({
    data: {
      emailToken,
      tokenType: TokenType.EMAIL,
      expiration: tokenExpiration,
      user: {
        connectOrCreate: {
          create: {
            email,
          },
          where: {
            email,
          },
        },
      },
    },
  })
};

export function getUserByEmailToken(prisma: PrismaClient, emailToken: string) {
  return prisma.token.findUnique({
    where: {
      emailToken: emailToken,
    },
    include: {
      user: true,
    },
  })
};

export function createJwtToken(prisma: PrismaClient, tokenExpiration: Date, email: string) {
  return prisma.token.create({
    data: {
      tokenType: TokenType.API,
      expiration: tokenExpiration,
      user: {
        connect: {
          email,
        },
      },
    },
  })
};

export function invalidateToken(prisma: PrismaClient, tokenId: number) {
  return prisma.token.update({
    where: {
      id: tokenId,
    },
    data: {
      valid: false,
    },
  })
};

export function getTokenById(prisma: PrismaClient, tokenId: number) {
  return prisma.token.findUnique({
    where: {
      id: tokenId,
    },
    include: {
      user: true,
    },
  })
};
