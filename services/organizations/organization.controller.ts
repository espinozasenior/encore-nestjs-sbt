import { api, APIError } from "encore.dev/api";
import { sunat } from "~encore/clients";

import type { IRubro } from "@/services/sunat/interfaces/rubro.interface";
import type { SerializableOrganization } from "./interfaces/serializable-organization.interface";
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

    const rubros: string[] = (await sunat.getRubros()).rubros.map(
      (r: IRubro) => r.id,
    );

    const errorMessage = checkCreateOrganizationDto(payload, rubros);
    if (errorMessage) throw APIError.invalidArgument(errorMessage);

    const organization = await organizationsService.create(payload);

    return {
      organization: toSerializableOrganization(organization),
    };
  },
);
