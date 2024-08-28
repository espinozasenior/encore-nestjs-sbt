import type { users as UserModel } from "@prisma/client";

import type { SerializableUser } from "../interfaces/serializable-user.interface";

export const toSerializableUser = (user: UserModel): SerializableUser => {
  return {
    id: user.id,
    clerkId: user.clerkId,
    onboardedAt: user.onboardedAt?.toISOString(),
  };
};
