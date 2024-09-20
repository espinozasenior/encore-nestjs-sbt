import { Injectable } from "@nestjs/common";
import { secret } from "encore.dev/config";
import { APIError } from "encore.dev/api";
import log from "encore.dev/log";
import { Redis } from "ioredis";

import type { IListSuppliersItemDto } from "./dtos/list-suppliers-item.dto";
import type { UserBankAccount } from "./types/user-account";
import type {
  PrometeoAPISuccessfulListUserAccountsResponse,
  PrometeoAPIListUserAccountsResponse,
  PrometeoAPISuccessfulLoginResponse,
  PrometeoAPIIncompleteLoginResponse,
  PrometeoAPIErrorLoginResponse,
  PrometeoAPIGetClientsResponse,
  PrometeoAPIGetClientsPayload,
  PrometeoAPILoginRequestBody,
  PrometeoAPILogoutResponse,
  PrometeoAPILoginResponse,
} from "./types/prometeo-api";
import type { Supplier } from "./types/supplier";
import type { Client } from "./types/client";
import { sleep } from "@/lib/thread";

/**
 * Maybe I'd like to remember why I'm doing this!
 * Because...
 *
 * - We want control over the data that is going in and out
 * - We don't want our API key to be exposed
 * - We want to link the streaming data to the user's account
 * - To cache the data in order to make costs lower
 * - Improve it to be more fault tolerant
 * - Validate the payload before sending it to Prometeo
 * - Rate limit the requests
 * - Make the API more easy to use 'cause it is a pain to use
 */

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

  /**
   * @description This is a helper function that returns a RequestInit object ready to be used against the Prometeo API.
   */
  private getPrometeoRequestInit(
    method: string,
    payload?: {
      additionalHeaders?: HeadersInit;
      body?: BodyInit;
    },
  ): RequestInit {
    const { additionalHeaders, body } = payload || {};

    return {
      method,
      headers: {
        Accept: "application/json",
        "X-API-Key": prometeoApiKey(),
        ...additionalHeaders,
      },
      body,
    };
  }

  private async getProvidersList(): Promise<{
    status: string;
    providers: IListSuppliersItemDto[];
  }> {
    const response = await fetch(
      `${prometeoApiUrl()}/provider/`,
      this.getPrometeoRequestInit("GET"),
    );

    const data = await response.json();

    return data as { status: string; providers: IListSuppliersItemDto[] };
  }

  private async getProviderDetails(code: string): Promise<{
    status: string;
    provider: Supplier;
  }> {
    const response = await fetch(
      `${prometeoApiUrl()}/provider/${code}/`,
      this.getPrometeoRequestInit("GET"),
    );

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

  async login(
    payload: PrometeoAPILoginRequestBody,
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<PrometeoAPISuccessfulLoginResponse> {
    const { maxBackoff, maxAttempts } = { ...defaultConfig, ...config };

    const faultTolerantLogin = async (
      retries = 0,
      backoff = 100,
    ): Promise<PrometeoAPILoginResponse> => {
      if (retries > 0) {
        log.warn(`trying to login again in... (${retries} retries)`);
      }

      const bodyParams = new URLSearchParams();
      bodyParams.append("provider", payload.provider);
      bodyParams.append("username", payload.username);
      bodyParams.append("password", payload.password);
      if (payload.type) bodyParams.append("type", payload.type);
      if (payload.otp) bodyParams.append("otp", payload.otp);

      const response = await fetch(
        `${prometeoApiUrl()}/login/`,
        this.getPrometeoRequestInit("POST", {
          additionalHeaders: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyParams.toString(),
        }),
      );

      if (!response.ok) {
        if (retries >= maxAttempts) {
          log.error(`login failed after ${retries} attempts`);

          throw APIError.deadlineExceeded("login failed");
        }

        const { status } = response;

        if (status === 502) {
          log.warn(
            `login failed with status ${status}, trying again in ${backoff}ms... (${retries} retries)`,
          );

          await sleep(backoff);

          const nextBackoff = Math.min(backoff * 2, maxBackoff);

          return await faultTolerantLogin(retries + 1, nextBackoff);
        }

        const data = (await response.json()) as PrometeoAPIErrorLoginResponse;
        log.debug(`login failed with http status ${response.status}: ${data}`);

        return data;
      }

      const data = await response.json();

      return data as
        | PrometeoAPISuccessfulLoginResponse
        | PrometeoAPIIncompleteLoginResponse;
    };

    const result = await faultTolerantLogin();

    if (result.status === "wrong_credentials") {
      throw APIError.permissionDenied("wrong credentials");
    }

    if (result.status === "error") {
      if (result.message === "Unauthorized provider") {
        throw APIError.permissionDenied("unauthorized provider");
      }

      log.warn("unknown API error, we can't return a correct diagnostic");

      throw APIError.internal(
        "unexpected error, contact with an administrator",
      );
    }

    // it could be 2XX but we still need to check the status :)))
    if (result.status === "interaction_required") {
      // they never explain the purpose of this
      log.debug("context is...", result.context);

      throw APIError.permissionDenied("interaction required");
    }

    return result;
  }

  async logout(key: string): Promise<{
    success: boolean;
  }> {
    const queryParams = new URLSearchParams({ key });
    const url = `${prometeoApiUrl()}/logout/?${queryParams}`;

    const response = await fetch(url, this.getPrometeoRequestInit("GET"));

    if (!response.ok) {
      const text = await response.text();
      const { status } = response;

      log.error(`logout failed with status code '${status}': ${text}`);
      log.warn(
        "[resilience] maybe we should implement a retry mechanism here...",
      );

      throw APIError.internal("unexpected error");
    }

    const data = (await response.json()) as PrometeoAPILogoutResponse;

    return {
      success: data.status === "logged_out",
    };
  }

  private async fetchUserAccounts(
    key: string,
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<PrometeoAPISuccessfulListUserAccountsResponse> {
    const { maxBackoff, maxAttempts } = { ...defaultConfig, ...config };

    const queryParams = new URLSearchParams({ key });
    const url = `${prometeoApiUrl()}/account/?${queryParams}`;

    const faultTolerantListUserAccounts = async (
      retries = 0,
      backoff = 100,
    ) => {
      const response = await fetch(url, this.getPrometeoRequestInit("GET"));

      if (!response.ok) {
        if (retries >= maxAttempts) {
          log.error(`login failed after ${retries} attempts`);

          throw APIError.deadlineExceeded("login failed");
        }

        const { status } = response;

        if (status === 502) {
          log.warn(
            `cannot list user accounts, trying again in... ${backoff}ms... (${retries} retries)`,
          );

          await sleep(backoff);

          const nextBackoff = Math.min(backoff * 2, maxBackoff);

          return await faultTolerantListUserAccounts(retries + 1, nextBackoff);
        }

        const text = await response.text();

        throw new Error(`request failed with status code ${status}: ${text}`);
      }

      const data = await response.json();

      return data as PrometeoAPIListUserAccountsResponse;
    };

    const result = await faultTolerantListUserAccounts();
    // ! check if the status is "success" as well

    if (result.status === "error") {
      if (result.message === "Invalid key") {
        throw APIError.permissionDenied(
          "Prometeo API key is invalid or expired",
        );
      }

      log.error(`Prometeo API error: ${result}`);

      throw APIError.internal("unexpected error");
    }

    return result;
  }

  async listUserAccounts(key: string): Promise<UserBankAccount[]> {
    try {
      const { accounts } = await this.fetchUserAccounts(key);

      return accounts;
    } catch (error) {
      if (error instanceof APIError) throw error;

      log.error(error, "error listing user accounts");

      throw APIError.unavailable("cannot list user accounts");
    }
  }

  private async fetchClients(
    { key }: PrometeoAPIGetClientsPayload,
    config?: PrometeoRequestConfig,
  ): Promise<PrometeoAPIGetClientsResponse> {
    const queryParams = new URLSearchParams({ key });

    const url = `${prometeoApiUrl()}/client/?${queryParams}`;

    const { maxBackoff, maxAttempts } = { ...defaultConfig, ...config };

    const faultTolerantGetClients = async (
      retries = 0,
      backoff = 100,
    ): Promise<PrometeoAPIGetClientsResponse> => {
      const response = await fetch(url, this.getPrometeoRequestInit("GET"));
      if (!response.ok) {
        if (retries >= maxAttempts) {
          throw APIError.deadlineExceeded("cannot get clients");
        }

        if (response.status === 502) {
          const nextBackoff = Math.min(backoff * 2, maxBackoff);

          return await faultTolerantGetClients(retries + 1, nextBackoff);
        }

        const text = await response.text();

        throw new Error(
          `request failed with status code ${response.status}: ${text}`,
        );
      }

      const data = await response.json();

      return data as PrometeoAPIGetClientsResponse;
    };

    return await faultTolerantGetClients();
  }

  async getClients(
    payload: PrometeoAPIGetClientsPayload,
    config?: PrometeoRequestConfig,
  ): Promise<Client[]> {
    const result = await this.fetchClients(payload, config);

    if (result.status === "success") {
      const results: Array<Client> = [];

      for (const id in result.clients) {
        const name = result.clients[id];

        results.push({ id, name });
      }

      return results;
    }

    return [];
  }
}
