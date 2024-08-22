import { createClerkClient, verifyToken } from "@clerk/backend";
import { type Header, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

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

    const jwt = await verifyToken(clerkToken, {
      secretKey: process.env.CLERK_SECRET_KEY,
      jwtKey: process.env.CLERK_JWT_PUBLIC_KEY,
    });

    const clerkUser = await clerkClient.users.getUser(jwt.sub);

    return {
      userID: jwt.sub,
      metadata: clerkUser,
    };
  },
);

export const gateway = new Gateway({
  authHandler: auth,
});
