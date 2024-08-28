import type { SunatProfile as SunatProfileModel } from "@prisma/client";

import type { SerializableSunatProfile } from "../interfaces/serializable-sunat-profile.interface";

export const toSerializableSunatProfile = (
  profile: SunatProfileModel,
): SerializableSunatProfile => ({
  id: profile.id,
  userId: profile.userId,
  account: profile.account,
});
