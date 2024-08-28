import { api, APIError } from "encore.dev/api";

import type { SerializableOrganization } from "./interfaces/organization.dto";
import {
  checkCreateOrganizationDto,
  type ICreateOrganizationDto,
} from "./dtos/create-organization.dto";
import { toSerializableOrganization } from "./helpers/serializable";
import applicationContext from "../applicationContext";

interface Response {
  organization: SerializableOrganization;
}

export const createOrganization = api(
  { expose: true, method: "POST", path: "/organizations", auth: true },
  async (payload: ICreateOrganizationDto): Promise<Response> => {
    const { organizationsService } = await applicationContext;

    const errorMessage = checkCreateOrganizationDto(payload);
    if (errorMessage) throw APIError.invalidArgument(errorMessage);

    const organization = await organizationsService.create(payload);

    return {
      organization: toSerializableOrganization(organization),
    };
  },
);
