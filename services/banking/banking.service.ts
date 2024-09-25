import { Injectable, type OnModuleInit } from "@nestjs/common";
import { prometeo, users } from "~encore/clients";
import { PrismaClient } from "@prisma/client";
import { secret } from "encore.dev/config";
import { APIError } from "encore.dev/api";
import log from "encore.dev/log";

import { validatePrometeoProviderAccessInputs } from "./validators/setup-provider-access";
import type { ISetupProviderAccessInputDto } from "./dtos/setup-provider.dto";
import type { PrometeoCredentials } from "./types/prometeo-credentials";
import type { Provider } from "../prometeo/types/provider";
import applicationContext from "../applicationContext";
import { ServiceError } from "./service-errors";

const credentialsEncryptionKey = secret("BankingCredentialsEncryptionKey");

@Injectable()
export class BankingService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async getPrometeoProviders(): Promise<Provider[]> {
    const providersResponse: { data: Provider[] } =
      await prometeo.listProviders();
    const providers = providersResponse.data;

    if (providers.length === 0) {
      log.error("no providers could be retrieved from Prometeo service");
      log.error("full response was...", providersResponse);

      throw ServiceError.somethingWentWrong;
    }

    return providers;
  }

  async userExistsById(userId: number): Promise<boolean> {
    try {
      const userExistsResponse: { userExists: boolean } =
        await users.existsById({ id: userId });

      return userExistsResponse.userExists;
    } catch (error) {
      log.error(
        `[microservice call error] could not check if user '${userId}' exists`,
        error,
      );

      throw ServiceError.somethingWentWrong;
    }
  }

  async setupPrometeoProviderAccess(
    inputs: ISetupProviderAccessInputDto,
  ): Promise<{ id: number; providerName: string }> {
    const providers = await this.getPrometeoProviders();

    const selectedProvider = providers.find(
      (p) => p.name === inputs.prometeo_provider,
    );
    if (!selectedProvider) {
      throw APIError.invalidArgument(
        `no provider found with name '${inputs.prometeo_provider}'`,
      );
    }

    const { name, bank } = selectedProvider;

    log.debug(
      `specified provider is '${name}' - ${bank.name} [${bank.code}]...`,
    );

    const apiError = validatePrometeoProviderAccessInputs(
      inputs,
      selectedProvider,
    );
    if (apiError) throw apiError;

    const userId = 1; // sorry!

    const userExists = await this.userExistsById(userId);
    if (!userExists) {
      log.error(`user with id "${userId}" does not exist, aborting...`);

      throw ServiceError.issuerNotFound;
    }

    try {
      const result = await this.savePrometeoProviderCredentials({
        providerName: inputs.prometeo_provider,
        credentials: inputs.credentials,
        userId,
      });

      return result;
    } catch (error) {
      if (error instanceof APIError) throw error;

      log.error("error while saving provider credentials", error);

      throw ServiceError.somethingWentWrong;
    }
  }

  async encryptProviderCredentials(
    credentials: PrometeoCredentials,
  ): Promise<string> {
    const jsonEncodedCredentials = JSON.stringify(credentials);

    const { securityService } = await applicationContext;

    return securityService.encryptAES256(
      jsonEncodedCredentials,
      credentialsEncryptionKey(),
    );
  }

  async savePrometeoProviderCredentials(inputs: {
    providerName: string;
    credentials: PrometeoCredentials;
    userId: number;
  }): Promise<{ id: number; providerName: string }> {
    let encryptedCredentials: string;

    try {
      encryptedCredentials = await this.encryptProviderCredentials(
        inputs.credentials,
      );
    } catch (error) {
      log.error("error while encrypting provider credentials", error);

      throw ServiceError.somethingWentWrong;
    }

    try {
      const result = await this.prometeoProviderCredentials.create({
        data: {
          providerName: inputs.providerName,
          userId: inputs.userId,
          encryptedCredentials,
        },
      });

      return {
        id: result.id,
        providerName: result.providerName,
      };
    } catch (error) {
      log.error("error while saving provider credentials", error);

      throw ServiceError.somethingWentWrong;
    }
  }
}
