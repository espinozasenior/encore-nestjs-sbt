import { api } from "encore.dev/api";

import applicationContext from "../applicationContext";

export const saveInternalUserIdInPublicMetadata = api(
  { expose: false },
  async (payload: {
    clerkId: string;
    userId: number;
  }): Promise<void> => {
    const { authService } = await applicationContext;

    await authService.saveInternalUserIdInPublicMetadata(
      payload.clerkId,
      payload.userId,
    );
  },
);
