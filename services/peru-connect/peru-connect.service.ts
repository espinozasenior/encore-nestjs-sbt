import { Injectable } from "@nestjs/common";
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
}
