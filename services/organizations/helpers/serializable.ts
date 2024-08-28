import type { Organization as OrganizationModel } from "@prisma/client";

import type { SerializableOrganization } from "../interfaces/organization.dto";

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
