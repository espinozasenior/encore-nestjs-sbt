import { api, APIError } from "encore.dev/api";

import applicationContext from "../applicationContext";
import type { DniDto } from "./dtos/dni.dto";

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
