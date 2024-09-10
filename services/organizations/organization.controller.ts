import { api, APIError } from "encore.dev/api";
import { sunat } from "~encore/clients";

import type { SerializableOrganization } from "./interfaces/serializable-organization.interface";
import type { AuthenticatedUser } from "../auth/interfaces/clerk.interface";
import type { IRubro } from "@/services/sunat/interfaces/rubro.interface";
import { toSerializableOrganization } from "./helpers/serializable";
import { QOMPA_INTERNAL_USER_ID_KEY } from "../auth/auth";
import {
  checkCreateOrganizationDto,
  type ICreateOrganizationDto,
} from "./dtos/create-organization.dto";
import applicationContext from "../applicationContext";
import { mustGetAuthData } from "@/lib/clerk";

const mustGetUserIdFromPublicMetadata = (
  authenticatedUser: AuthenticatedUser,
): number => {
  const userId = authenticatedUser.metadata.publicMetadata[
    QOMPA_INTERNAL_USER_ID_KEY
  ] as number | undefined;
  if (!userId) {
    throw APIError.notFound("you should create your user first");
  }

  return userId;
};

export const getOrganizations = api(
  { expose: true, method: "GET", path: "/organizations", auth: true },
  async (): Promise<{
    organizations: SerializableOrganization[];
  }> => {
    const { organizationsService } = await applicationContext;

    const authenticatedUser = mustGetAuthData();

    const userId = mustGetUserIdFromPublicMetadata(authenticatedUser);
    const organizations = await organizationsService.getAllForUser(userId);

    return {
      organizations: organizations.map((organization) =>
        toSerializableOrganization(organization),
      ),
    };
  },
);

export const createOrganization = api(
  { expose: true, method: "POST", path: "/organizations", auth: true },
  async (
    payload: ICreateOrganizationDto,
  ): Promise<{ organization: SerializableOrganization }> => {
    const { organizationsService } = await applicationContext;

    const rubros: string[] = (await sunat.getRubros()).rubros.map(
      (r: IRubro) => r.id,
    );

    const errorMessage = checkCreateOrganizationDto(payload, rubros);
    if (errorMessage) throw APIError.invalidArgument(errorMessage);

    const authenticatedUser = mustGetAuthData();

    const userId = mustGetUserIdFromPublicMetadata(authenticatedUser);
    const organization = await organizationsService.create(userId, payload);

    return {
      organization: toSerializableOrganization(organization),
    };
  },
);
