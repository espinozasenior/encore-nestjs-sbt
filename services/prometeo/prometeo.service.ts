import { Injectable } from "@nestjs/common";
import { secret } from "encore.dev/config";
import { APIError } from "encore.dev/api";
import log from "encore.dev/log";
import { Redis } from "ioredis";

import type { IListSuppliersItemDto } from "./dtos/list-suppliers-item.dto";
import { ServiceError } from "./service-errors";
import type {
  UserBankAccount,
  UserBankAccountMovement,
} from "./types/user-account";
import type { LoginResponse } from "./types/response";
import type {
  PrometeoAPISuccessfulListUserAccountsResponse,
  PrometeoAPIListUserAccountsResponse,
  PrometeoAPIGetClientsErrorResponse,
  PrometeoAPIErrorLoginResponse,
  PrometeoAPIGetClientsResponse,
  PrometeoAPIGetClientsPayload,
  PrometeoAPILoginRequestBody,
  PrometeoAPILogoutResponse,
  PrometeoAPILoginResponse,
  PrometeoAPISelectClientResponse,
  PrometeoAPIListUserAccountMovementsPayload,
  PrometeoAPIListUserAccountMovementsResponse,
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
 * - Make the API more easy to use :))))))))
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

  private async doGetProvidersList(): Promise<{
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

  private async doGetProviderDetails(code: string): Promise<{
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

  private async doGetDetailedProviders(
    countryCode = "PE",
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<Supplier[]> {
    const { providers } = await this.doGetProvidersList();

    const { maxBackoff, maxAttempts } = { ...defaultConfig, ...config };

    const getProviderDetails = async (
      code: string,
      attempt = 0,
      backoff = 100,
    ): Promise<Supplier> => {
      try {
        const { provider } = await this.doGetProviderDetails(code);

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

    const suppliers = await this.doGetDetailedProviders(countryCode, config);

    try {
      const value = JSON.stringify(suppliers);
      await this.cache.setex(key, 60 * 60 * 12, value);
    } catch (error) {
      log.warn(error, "error caching Prometeo suppliers in kv database");
    }

    return suppliers;
  }

  private async doLogin(
    payload: PrometeoAPILoginRequestBody,
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<PrometeoAPILoginResponse> {
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

          throw ServiceError.deadlineExceeded;
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

      return data as PrometeoAPILoginResponse;
    };

    return await faultTolerantLogin();
  }

  async login(
    payload: PrometeoAPILoginRequestBody,
    config?: PrometeoRequestConfig,
  ): Promise<LoginResponse> {
    const result = await this.doLogin(payload, config);

    if (result.status === "wrong_credentials") {
      throw ServiceError.wrongCredentials;
    }

    if (result.status === "error") {
      if (result.message === "Unauthorized provider") {
        throw ServiceError.unauthorizedProvider;
      }
      log.warn("unknown API error, we can't return a correct diagnostic");
      throw ServiceError.somethingWentWrong;
    }

    if (result.status === "logged_in") {
      return {
        session: {
          key: result.key,
          requires: "nothing",
        },
      };
    }

    if (result.status === "select_client") {
      const clients = await this.getClients({ key: result.key });

      return {
        session: {
          key: result.key,
          requires: "specify_client",
        },
        clients,
      };
    }

    if (result.status === "interaction_required") {
      if (result.field === "otp") {
        return {
          session: {
            key: result.key,
            requires: "otp_code",
          },
        };
      }

      if (result.field === "personal_questions") {
        throw APIError.unimplemented(
          "you need to answer a personal question to continue but is not supported yet",
        );
      }
    }

    log.error("something is off with the Prometeo API .:", result);
    log.error("cannot complete log-in process...");

    throw ServiceError.somethingWentWrong;
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

      throw ServiceError.somethingWentWrong;
    }

    const data = (await response.json()) as PrometeoAPILogoutResponse;

    return {
      success: data.status === "logged_out",
    };
  }

  private async doListUserAccounts(
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

          throw ServiceError.deadlineExceeded;
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
        throw ServiceError.sessionKeyInvalidOrExpired;
      }

      log.error(`Prometeo API error: ${result}`);

      throw ServiceError.somethingWentWrong;
    }

    return result;
  }

  async listUserAccounts(key: string): Promise<UserBankAccount[]> {
    try {
      const { accounts } = await this.doListUserAccounts(key);

      return accounts;
    } catch (error) {
      if (error instanceof APIError) throw error;

      log.error(error, "error listing user accounts");

      throw ServiceError.somethingWentWrong;
    }
  }

  private async doGetClients(
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
          log.error(`cannot get clients after ${retries} attempts`);

          throw ServiceError.deadlineExceeded;
        }

        if (response.status === 502) {
          const nextBackoff = Math.min(backoff * 2, maxBackoff);

          return await faultTolerantGetClients(retries + 1, nextBackoff);
        }

        const text = await response.text();
        const data = JSON.parse(text);

        log.debug(
          `request failed with status code ${response.status}: ${text}`,
        );

        return data as PrometeoAPIGetClientsErrorResponse;
      }

      // return {
      //   status: "success",
      //   clients: {
      //     "FIC-02412222": "FIDEICOMISO CONSORCIO PUENTES FC",
      //     "FIC-02501212": "FIDEICOMISO PEÑAROL",
      //     "FIC-00021244": "FIDEICOMISO CARE TEST",
      //   },
      // };

      const data = await response.json();

      return data as PrometeoAPIGetClientsResponse;
    };

    return await faultTolerantGetClients();
  }

  async getClients(
    payload: PrometeoAPIGetClientsPayload,
    config?: PrometeoRequestConfig,
  ): Promise<Client[]> {
    let result: PrometeoAPIGetClientsResponse;

    try {
      result = await this.doGetClients(payload, config);
    } catch (error) {
      if (error instanceof APIError) throw error;

      log.error(error, "[internal] error getting clients");

      throw ServiceError.somethingWentWrong;
    }

    if (result.status === "error") {
      if (
        result.message === "Missing API key" ||
        result.message === "Key not Found"
      ) {
        log.error(
          "Prometeo API key is missing or invalid! Modify it in Encore's Dashboard!",
        );

        log.warn("Prometeo API's response was...", result);

        throw ServiceError.somethingWentWrong;
      }

      if (result.message === "Invalid key") {
        throw ServiceError.sessionKeyInvalidOrExpired;
      }

      return [];
    }

    result.clients = {
      "FIC-02412222": "FIDEICOMISO CONSORCIO PUENTES FC",
      "FIC-02501212": "FIDEICOMISO PEÑAROL",
      "FIC-00021244": "FIDEICOMISO CARE TEST",
    };

    const results: Array<Client> = [];

    for (const id in result.clients) {
      const name = result.clients[id];

      results.push({ id, name });
    }

    return results;
  }

  async doSelectClient(
    key: string,
    client: string,
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<PrometeoAPISelectClientResponse> {
    const { maxBackoff, maxAttempts } = { ...defaultConfig, ...config };

    const url = `${prometeoApiUrl()}/client/${client}/?key=${key}`;
    const requestInit = this.getPrometeoRequestInit("GET");

    const faulTolerantSelectClient = async (
      retries = 0,
      backoff = 200,
    ): Promise<PrometeoAPISelectClientResponse> => {
      const response = await fetch(url, requestInit);

      if (!response.ok) {
        if (retries >= maxAttempts) {
          log.error(`cannot select client after ${retries} attempts`);

          throw ServiceError.deadlineExceeded;
        }

        const { status } = response;

        if (status === 502) {
          log.warn(
            "cannot select client, trying again in... ${backoff}ms... (${retries} retries)",
          );

          await sleep(backoff);

          const nextBackoff = Math.min(backoff * 2, maxBackoff);

          return await faulTolerantSelectClient(retries + 1, nextBackoff);
        }

        const text = await response.text();

        throw new Error(`request failed with status code ${status}: ${text}`);
      }

      const data = await response.json();

      return data as PrometeoAPISelectClientResponse;
    };

    return await faulTolerantSelectClient();
  }

  async selectClient(
    key: string,
    client: string,
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<void> {
    try {
      const result = await this.doSelectClient(key, client, config);
      if (result.status === "success") {
        return;
      }

      if (result.message === "Invalid key") {
        throw ServiceError.sessionKeyInvalidOrExpired;
      }

      if (result.message === "wrong_client") {
        throw APIError.notFound(`specified client '${client}' does not exist`);
      }
    } catch (error) {
      if (error instanceof APIError) throw error;

      log.error(error, "[internal] error selecting client");

      throw ServiceError.somethingWentWrong;
    }
  }

  async doListUserAccountMovements(
    payload: PrometeoAPIListUserAccountMovementsPayload,
    config?: Partial<PrometeoRequestConfig>,
  ): Promise<PrometeoAPIListUserAccountMovementsResponse> {
    const { maxBackoff, maxAttempts } = { ...defaultConfig, ...config };

    const queryParams = new URLSearchParams({
      key: payload.key,
      currency: payload.currency,
      date_start: payload.date_start,
      date_end: payload.date_end,
    });

    const url = `${prometeoApiUrl()}/account/${payload.account}/movement/?${queryParams}`;
    const requestInit = this.getPrometeoRequestInit("GET");

    const faultTolerantListUserAccountMovements = async (
      retries = 0,
      backoff = 100,
    ): Promise<PrometeoAPIListUserAccountMovementsResponse> => {
      const response = await fetch(url, requestInit);

      if (!response.ok) {
        if (retries >= maxAttempts) {
          log.error(`cannot list user accounts after ${retries} attempts`);

          throw ServiceError.deadlineExceeded;
        }

        const { status } = response;

        if (status === 502) {
          log.warn(
            `cannot list user accounts, trying again in... ${backoff}ms... (${retries} retries)`,
          );

          await sleep(backoff);

          const nextBackoff = Math.min(backoff * 2, maxBackoff);

          return await faultTolerantListUserAccountMovements(
            retries + 1,
            nextBackoff,
          );
        }

        const text = await response.text();

        throw new Error(`request failed with status code ${status}: ${text}`);
      }

      const data = await response.json();

      return data as PrometeoAPIListUserAccountMovementsResponse;
    };

    return await faultTolerantListUserAccountMovements();
  }

  async listUserAccountMovements(
    payload: PrometeoAPIListUserAccountMovementsPayload,
    config?: PrometeoRequestConfig,
  ): Promise<UserBankAccountMovement[]> {
    try {
      const result = await this.doListUserAccountMovements(payload, config);
      if (result.status === "error") {
        if (result.message === "Invalid key") {
          throw ServiceError.sessionKeyInvalidOrExpired;
        }

        log.error("error listing user accounts but cannot be handled");

        throw ServiceError.somethingWentWrong;
      }

      return result.movements;
    } catch (error) {
      if (error instanceof APIError) throw error;

      log.error(error, "[internal] error listing user accounts");

      throw ServiceError.somethingWentWrong;
    }
  }
}
