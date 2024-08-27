import { Injectable } from "@nestjs/common";
import { parse as parseHtml } from "node-html-parser";
import axios from "axios";

import type { LegalRepresentativeDto } from "./dtos/legal-representatives.dto";
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
    const [results, representatives] = await Promise.all([
      this.searchEntities<RucDto>([
        {
          type: "RUC",
          number: ruc,
        },
      ]),
      this.searchLegalRepresentsByRUC(ruc),
    ]);

    const result = results.find((result) => result.ruc === ruc);
    if (!result) return null;

    if (representatives) {
      result.representatives = representatives;
    }

    return result;
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
    ruc: string,
  ): Promise<Array<LegalRepresentativeDto> | null> {
    const params = new URLSearchParams();

    params.append("accion", "getRepLeg");
    params.append("nroRuc", ruc);
    params.append("desRuc", "");

    const { data } = await axios.post(
      "https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/jcrS00Alias",
      params,
    );

    const sanitize = (s: string): string =>
      s
        .replace(/^[\\r\\n\s]+/, "")
        .replace(/[\\r\\n\s]+$/, "")
        .replace("  ", " ");

    const document = parseHtml(data);
    const tds = document.querySelectorAll(".panel .table td");
    const results: Array<LegalRepresentativeDto> = [];

    if (tds.length === 0) return null;

    for (let i = 0; i < tds.length; i += 5) {
      const type = sanitize(tds[i].innerText);
      const number = sanitize(tds[i + 1].innerText);
      const names = sanitize(tds[i + 2].innerText);
      const role = sanitize(tds[i + 3].innerText);
      const since = sanitize(tds[i + 4].innerText);

      results.push({
        document: { type, number },
        names,
        role,
        since,
      });
    }

    return results;
  }
}
