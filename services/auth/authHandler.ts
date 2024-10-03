import { type Header, APIError, Gateway } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";

import type { AuthenticatedUser } from "./interfaces/clerk.interface";
import applicationContext from "../applicationContext";

interface AuthParams {
  authorization: Header<"Authorization">;
}

export const auth = authHandler<AuthParams, AuthenticatedUser>(
  async (params): Promise<AuthenticatedUser> => {
    try {
      const { authService } = await applicationContext;

      const clerkToken = params.authorization.replace("Bearer ", "");
      const jwt = await authService.verifyToken(clerkToken);

      const clerkUser = await authService.getUser(jwt.sub);

      return {
        userID: jwt.sub,
        metadata: clerkUser,
      };
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }

      console.error(
        `something went unexpectedly wrong while authenticating user: ${JSON.stringify(error)}`,
      );

      throw APIError.deadlineExceeded("something went wrong");
    }
  },
);

export const gateway = new Gateway({
  authHandler: auth,
});
