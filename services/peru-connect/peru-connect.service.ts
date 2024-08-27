import { Injectable } from "@nestjs/common";
import parseHtml from "node-html-parser";
import axios from "axios";

import type { LegalRepresentativesDto } from "./dtos/legal-representatives.dto";
import type { RucDto } from "./dtos/ruc.dto";
import type { DniDto } from "./dtos/dni.dto";

interface EntitySearchParam {
  type: "RUC" | "DNI";
  number: string;
}

@Injectable()
export class PeruConnectService {
  private async searchEntities<T>(
    documents: EntitySearchParam[],
  ): Promise<T[]> {
    if (documents.length === 0) return [];

    const response = await fetch(process.env.APIPERU_URL, {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.APIPERU_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        documents,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `failed to search entities(${documents}), response status: ${response.statusText}`,
      );
    }

    const results = await response.json();

    return results as T[];
  }

  async searchByRUC(ruc: string): Promise<RucDto | null> {
    const results = await this.searchEntities<RucDto>([
      {
        type: "RUC",
        number: ruc,
      },
    ]);

    return results.find((result) => result.ruc === ruc) ?? null;
  }

  async searchByDNI(dni: string): Promise<DniDto | null> {
    const results = await this.searchEntities<DniDto>([
      {
        type: "DNI",
        number: dni,
      },
    ]);

    return results.find((result) => result.dni === dni) ?? null;
  }

  async searchLegalRepresentsByRUC(
    _ruc: string,
  ): Promise<LegalRepresentativesDto[] | null> {
    const params = new URLSearchParams();

    params.append("accion", "getRepLeg");
    params.append("contexto", "ti-it");
    params.append("modo", "1");
    params.append(
      "desRuc",
      "INVERSIONES.IO+PERU+SOCIEDAD+ADMINISTRADORA+DE+PLATAFORMA+DE+FINANCIAMIENTO+PARTICIPATIVO+FINANCIER",
    );
    params.append("nroRuc", "20605667351");

    const { data } = await axios.post(
      "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias",
      params,
    );

    const document = parseHtml(data);
    const docTable = document.querySelector(".panel .table");

    const sanitize = (s: string): string =>
      s.replace(/^[\\r\\n\s]+/, "").replace(/[\\r\\n\s]+$/, "");

    const results: LegalRepresentativesDto[] = [];

    if (docTable) {
      const tds = docTable.querySelectorAll("td");

      tds.forEach((_, index) => {
        if (index !== 0 && index % 4 === 0) {
          results.push({
            document: {
              type: sanitize(tds[index - 4].innerText),
              number: sanitize(tds[index - 3].innerText),
            },
            names: sanitize(tds[index - 2].innerText),
            role: sanitize(tds[index - 1].innerText),
            since: sanitize(tds[index].innerText),
          });
        }
      });
    }

    return results;
  }
}
