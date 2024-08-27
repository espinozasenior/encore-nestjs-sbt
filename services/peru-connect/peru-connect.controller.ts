import { api, APIError } from "encore.dev/api";

import applicationContext from "../applicationContext";
import type { DniDto } from "./dtos/dni.dto";
import type { RucDto } from "./dtos/ruc.dto";

export const searchByDNI = api(
  { expose: true, method: "GET", path: "/peru-connect/search-by-dni/:dni" },
  async ({ dni }: { dni: string }): Promise<DniDto> => {
    if (!dni) throw APIError.invalidArgument("dni is required");
    if (dni.length !== 9)
      throw APIError.invalidArgument("dni must have 9 digits");
    if (Number.isNaN(Number.parseInt(dni)))
      throw APIError.invalidArgument("dni must be contain only digits");

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
    if (!ruc) throw APIError.invalidArgument("ruc is required");
    if (ruc.length !== 11)
      throw APIError.invalidArgument("ruc must have 11 digits");
    if (Number.isNaN(Number.parseInt(ruc)))
      throw APIError.invalidArgument("ruc must be contain only digits");
    if (ruc[0] !== "1" && ruc[0] !== "2")
      throw APIError.invalidArgument("ruc must start with 1 or 2");

    const { peruConnectService } = await applicationContext;

    const result = await peruConnectService.searchByRUC(ruc);
    if (!result) {
      throw APIError.notFound("ruc not found");
    }

    return result;
  },
);
