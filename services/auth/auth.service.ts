import { Injectable, type OnModuleInit } from "@nestjs/common";
import type { JwtPayload } from "@clerk/types";
import {
  createClerkClient,
  type ClerkClient,
  verifyToken,
  type User,
} from "@clerk/backend";
import { PrismaClient } from "@prisma/client";
import { APIError } from "encore.dev/api";
import log from "encore.dev/log";

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  clerkClient: ClerkClient;

  async onModuleInit() {
    await this.$connect();
  }

  constructor() {
    super();

    this.clerkClient = createClerkClient({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }

  async verifyToken(clerkToken: string): Promise<JwtPayload> {
    try {
      const jwt = await verifyToken(clerkToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
        jwtKey: process.env.CLERK_JWT_PUBLIC_KEY,
      });

      return jwt;
    } catch (error) {
      if (error instanceof Error) {
        log.debug(error.message);

        if (error.message.includes("is expired")) {
          throw APIError.unauthenticated("token expired");
        }

        throw APIError.unauthenticated("invalid credentials");
      }

      log.with(["unexpected error"]).error(error);

      throw APIError.internal("unexpected error");
    }
  }

  async getUser(userId: string): Promise<User> {
    return await this.clerkClient.users.getUser(userId);
  }
}
