import { createClerkClient, verifyToken } from "@clerk/backend";
import { type Header, APIError, ErrCode, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import log from "encore.dev/log";

import type { AuthenticatedUser } from "./interfaces/clerk.interface";

interface AuthParams {
  authorization: Header<"Authorization">;
}

const clerkClient = createClerkClient({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

export const auth = authHandler<AuthParams, AuthenticatedUser>(
  async (params): Promise<AuthenticatedUser> => {
    const clerkToken = params.authorization.replace("Bearer ", "");

    try {
      const jwt = await verifyToken(clerkToken, {
        secretKey: process.env.CLERK_SECRET_KEY,
        jwtKey: process.env.CLERK_JWT_PUBLIC_KEY,
      });

      const clerkUser = await clerkClient.users.getUser(jwt.sub);

      return {
        userID: jwt.sub,
        metadata: clerkUser,
      };
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
  },
);

export const gateway = new Gateway({
  authHandler: auth,
});
