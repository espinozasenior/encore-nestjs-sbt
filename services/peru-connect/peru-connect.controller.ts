import { api, APIError } from "encore.dev/api";

import applicationContext from "../applicationContext";
import type { DniDto } from "./dtos/dni.dto";
import type { RucDto } from "./dtos/ruc.dto";

export const searchByDNI = api(
  { expose: true, method: "GET", path: "/peru-connect/search-by-dni/:dni" },
  async ({ dni }: { dni: string }): Promise<DniDto> => {
    const { peruConnectService } = await applicationContext;

    const result = await peruConnectService.searchByDNI(dni);
    if (!result) {
      throw APIError.notFound("dni not found");
    }

    return result;
  },
);

export const searchByRUC = api(
  { expose: true, method: "GET", path: "/peru-connect/search-by-ruc/:ruc" },
  async ({ ruc }: { ruc: string }): Promise<RucDto> => {
    const { peruConnectService } = await applicationContext;

    const result = await peruConnectService.searchByRUC(ruc);
    if (!result) {
      throw APIError.notFound("ruc not found");
    }

    return result;
  },
);
