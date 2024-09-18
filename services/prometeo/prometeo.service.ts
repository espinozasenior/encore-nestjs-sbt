import { Injectable } from "@nestjs/common";
import { secret } from "encore.dev/config";
import log from "encore.dev/log";
import { Redis } from "ioredis";

import type { IListSuppliersItemDto } from "./dtos/list-suppliers-item.dto";
import type { Supplier } from "./types/supplier";
import { sleep } from "@/lib/thread";

const prometeoApiUrl = secret("PrometeoApiUrl");
const prometeoApiKey = secret("PrometeoApiKey");
const redisUsername = secret("RedisUsername");
const redisPassword = secret("RedisPassword");
const redisPort = secret("RedisPort");
const redisHost = secret("RedisHost");

interface PrometeoRequestConfig {
  maxBackoff: number;
  maxAttempts: number;
}

const defaultConfig: PrometeoRequestConfig = {
  maxBackoff: 3000,
  maxAttempts: 5,
};

@Injectable()
export class PrometeoService {
  cache: Redis;

  constructor() {
    this.cache = new Redis({
      username: redisUsername(),
      password: redisPassword(),
      host: redisHost(),
      port: Number.parseInt(redisPort()),
    });
  }

  private async getProvidersList(): Promise<{
    status: string;
    providers: IListSuppliersItemDto[];
  }> {
    const response = await fetch(`${prometeoApiUrl()}/provider/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": prometeoApiKey(),
      },
    });

    const data = await response.json();

    return data as { status: string; providers: IListSuppliersItemDto[] };
  }

  private async getProviderDetails(code: string): Promise<{
    status: string;
    provider: Supplier;
  }> {
    const response = await fetch(`${prometeoApiUrl()}/provider/${code}/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-Key": prometeoApiKey(),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      const { status } = response;

      throw new Error(
        `request to Prometeo API failed with status '${status}': ${text}`,
      );
    }

    const data = await response.json();

    return data as { status: string; provider: Supplier };
  }

  private async getDetailedProviders(
    countryCode = "PE",
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<Supplier[]> {
    const { providers } = await this.getProvidersList();

    const { maxBackoff, maxAttempts } = { ...defaultConfig, ...config };

    const getProviderDetails = async (
      code: string,
      attempt = 0,
      backoff = 100,
    ): Promise<Supplier> => {
      try {
        const { provider } = await this.getProviderDetails(code);

        if (attempt !== 0) {
          log.debug(
            `successfully got provider details from Prometeo API after ${attempt} attempts (provider code: ${code})`,
          );
        }

        return provider;
      } catch (error) {
        if (attempt >= maxAttempts) {
          throw error;
        }

        log.warn(
          error,
          "error getting provider details from providers from Prometeo API",
        );
        log.debug(
          `trying to get provider details again in ${backoff}ms (provider code: ${code})`,
        );

        await sleep(backoff);

        const nextBackoff = Math.min(backoff * 2, maxBackoff);

        return await getProviderDetails(code, attempt + 1, nextBackoff);
      }
    };

    const results = await Promise.allSettled(
      providers
        .filter((p) => {
          const isSpecifiedCountry = p.country === countryCode;
          const isCorp = p.code.includes("corp") || p.code.includes("smes");

          return isSpecifiedCountry && isCorp;
        })
        .map(async (p) => await getProviderDetails(p.code)),
    );

    const filteredResults = results.filter((result) => {
      if (result.status === "rejected") {
        log.error(
          "error getting provider details from Prometeo API",
          result.reason,
        );
      }

      return result.status === "fulfilled";
    });

    return filteredResults.map((result) => result.value);
  }

  async getSuppliers(
    countryCode = "PE",
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<Supplier[]> {
    const key = "prometeo-suppliers";

    const result = await this.cache.get(key);
    if (result) {
      return JSON.parse(result) as Supplier[];
    }

    const suppliers = await this.getDetailedProviders(countryCode, config);

    try {
      const value = JSON.stringify(suppliers);
      await this.cache.setex(key, 60 * 60 * 12, value);
    } catch (error) {
      log.warn(error, "error caching Prometeo suppliers in kv database");
    }

    return suppliers;
  }
}
