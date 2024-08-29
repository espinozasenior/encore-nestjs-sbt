import { Injectable, type OnModuleInit } from "@nestjs/common";
import { parse as parseHtml } from "node-html-parser";
import { PrismaClient, type SunatProfile } from "@prisma/client";
import { APIError } from "encore.dev/api";
import { users } from "~encore/clients";
import log from "encore.dev/log";
import axios from "axios";

import type { LegalRepresentativeDto } from "./interfaces/legal-representative.interface";
import {
  type ISaveSunatProfileDto,
  checkSaveSunatProfileDto,
} from "./dtos/save-sunat-profile.dto";
import applicationContext from "../applicationContext";
import type { RucDto } from "./interfaces/ruc.interface";
import type { DniDto } from "./interfaces/dni.interface";

interface EntitySearchParam {
  type: "RUC" | "DNI";
  number: string;
}

@Injectable()
export class PeruConnectService extends PrismaClient implements OnModuleInit {
  private sunatEncryptionKey: string;

  async onModuleInit() {
    await this.$connect();
  }

  constructor() {
    super();

    this.sunatEncryptionKey = process.env.INTERNAL_SUNAT_ENCRYPTION_KEY;
  }

  async saveSunatProfile(
    userOwnerId: number,
    { account, solKey }: ISaveSunatProfileDto,
  ): Promise<SunatProfile> {
    const apiError = checkSaveSunatProfileDto({ account, solKey });
    if (apiError) throw apiError;

    const { securityService } = await applicationContext;

    const { userExists } = await users.existsById({
      id: userOwnerId,
    });
    if (!userExists) {
      log.error(
        `user with id '${userOwnerId}' not found but it tried to save its sunat profile`,
      );
      throw APIError.notFound("user not found");
    }

    const sunatProfileExists =
      await this.sunatProfileExistsByUserId(userOwnerId);
    if (sunatProfileExists) {
      log.warn(
        `user with id '${userOwnerId}' already has a sunat profile but it tried to save its sunat profile`,
      );
      throw APIError.alreadyExists("user already has a sunat profile");
    }

    const encryptedSolKey = securityService.encryptAES256(
      solKey,
      this.sunatEncryptionKey,
    );

    const profile = await this.sunatProfile.create({
      data: {
        userId: userOwnerId,
        account,
        encryptedSolKey,
      },
    });

    return profile;
  }

  async sunatProfileExistsByUserId(userId: number): Promise<boolean> {
    return (await this.sunatProfile.count({ where: { userId } })) > 0;
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

  private async searchLegalRepresentsByRUC(
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
