import type { Organization as OrganizationModel } from "@prisma/client";

import type { SerializableOrganization } from "../interfaces/serializable-organization.interface";

export const toSerializableOrganization = (
  organization: OrganizationModel,
): SerializableOrganization => {
  return {
    id: organization.id,
    name: organization.name,
    category: organization.category,
    ruc: organization.ruc,
    size: organization.size,
  };
};
