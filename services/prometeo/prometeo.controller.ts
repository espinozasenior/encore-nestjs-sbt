import { api, type Header } from "encore.dev/api";
import log from "encore.dev/log";

import type { IGetClientsResponse } from "./interfaces/get-clients-response.interface";
import type { PrometeoAPILoginRequestBody } from "./types/prometeo-api";
import type {
  UserBankAccount,
  UserBankAccountMovement,
} from "./types/user-account";
import applicationContext from "../applicationContext";
import type { Supplier } from "./types/supplier";
import {
  validateListUserAccountsPayload,
  validateSelectClientPayload,
  validateGetClientsPayload,
  validateLoginPayload,
  validateLogoutPayload,
  validateListUserAccountMovementsPayload,
} from "./validators/prometeo-api";
import type { LoginResponse } from "./types/response";
import { ServiceError } from "./service-errors";

// Login to the specified provider using the Prometeo API.
export const login = api(
  { expose: true, method: "POST", path: "/third-party/prometeo/auth/login" },
  async (payload: PrometeoAPILoginRequestBody): Promise<LoginResponse> => {
    log.debug(
      `'${payload.username}' is logging in to Prometeo API using provider '${payload.provider}'...`,
    );

    const { prometeoService } = await applicationContext;

    log.debug("retrieving list of available suppliers to validate the payload");

    const suppliers = await prometeoService.getSuppliers();
    const supplierNames = suppliers.map((s) => s.name);

    log.debug("validating payload...");

    const apiError = validateLoginPayload(payload, supplierNames);
    if (apiError) throw apiError;

    log.debug("payload is valid, logging in...");

    const result = await prometeoService.login(payload);

    if (result.session.key.length !== 32) {
      log.warn(
        "generated Prometeo API session key is not 32 characters long, some anomalies may occur!",
      );
    }

    return result;
  },
);

// Exits the session specified in the headers.
export const logout = api(
  { expose: true, method: "POST", path: "/third-party/prometeo/auth/logout" },
  async (payload: {
    // The session key to be passed to the Prometeo API.
    key: Header<"X-Prometeo-Session-Key">;
  }): Promise<{
    // Whether the logout was successful or not.
    success: boolean;
  }> => {
    const apiError = validateLogoutPayload(payload);
    if (apiError) throw apiError;

    const { prometeoService } = await applicationContext;

    const { success } = await prometeoService.logout(payload.key);

    return { success };
  },
);

// Endpoint to query movements of a user account in a given currency and date range.
export const queryUserAccountMovements = api(
  {
    expose: true,
    method: "GET",
    path: "/third-party/prometeo/accounts/:account/movements",
  },
  async (payload: {
    // The session key to be passed to the Prometeo API.
    key: Header<"X-Prometeo-Session-Key">;
    // The account to query. See '/third-party/prometeo/accounts' to retrieve a list of accounts
    // in the current provider and/or client.
    account: string;
    // The currency that the account is denominated in.
    currency: string;
    // The date in 'dd/mm/yyyy' format from which to start querying movements.
    date_start: string;
    // The date in 'dd/mm/yyyy' format until which to query movements.
    date_end: string;
  }): Promise<{
    // An array containing all the movements that the specified account has made in the specified currency.
    data: UserBankAccountMovement[];
  }> => {
    log.debug(
      `retrieving movements from account ${payload.account}(${payload.currency}) from ${payload.date_start} to ${payload.date_end}...`,
    );

    const apiError = validateListUserAccountMovementsPayload(payload);
    if (apiError) throw apiError;

    const { prometeoService } = await applicationContext;

    const data = await prometeoService.listUserAccountMovements(payload);

    log.debug(`returning ${data.length} user account movements...`);

    return { data };
  },
);

// List all the providers that the Prometeo API supports.
export const listSuppliers = api(
  { expose: true, method: "GET", path: "/third-party/prometeo/suppliers" },
  async (): Promise<{
    // An array with all the providers that the Prometeo API supports.
    data: Supplier[];
  }> => {
    const { prometeoService } = await applicationContext;

    log.debug("retrieving suppliers...");

    const data = await prometeoService.getSuppliers();

    log.debug(`${data.length} suppliers retrieved`);

    return { data };
  },
);

// List all the clients that the current user has access to. Those clients changes
// depending on the previously specified provider at endpoint to login.
export const listClients = api(
  { expose: true, method: "GET", path: "/third-party/prometeo/clients" },
  async (payload: {
    // The session key to be passed to the Prometeo API.
    key: Header<"X-Prometeo-Session-Key">;
  }): Promise<IGetClientsResponse> => {
    const { prometeoService } = await applicationContext;

    const apiError = validateGetClientsPayload(payload);
    if (apiError) throw apiError;

    const data = await prometeoService.getClients(payload);

    return { data };
  },
);

// List all the accounts that the specified session key has access to.
// Those accounts will vary depending on the specified provider and/or client.
export const listUserAccounts = api(
  { expose: true, method: "GET", path: "/third-party/prometeo/accounts" },
  async (payload: {
    // The session key to be passed to the Prometeo API.
    key: Header<"X-Prometeo-Session-Key">;
  }): Promise<{
    // An array containing all the accounts that the specified session key has access to.
    data: UserBankAccount[];
  }> => {
    const apiError = validateListUserAccountsPayload(payload);
    if (apiError) throw apiError;

    const { prometeoService } = await applicationContext;

    const data = await prometeoService.listUserAccounts(payload.key);

    return { data };
  },
);

// Endpoint to specify the client to use for the current session if the
// provider requires it after login.
//
// If the key requires to specify a client, it will keep in standby for
// some minutes until the client is selected.
export const selectClient = api(
  {
    expose: true,
    method: "POST",
    path: "/third-party/prometeo/select-client",
  },
  async (payload: {
    // The session key to be passed to the Prometeo API. This is
    // a key that is supposed to be waiting for this operation.
    key: Header<"X-Prometeo-Session-Key">;
    // The ID of the client to use for the current session.
    client: string;
  }): Promise<void> => {
    const { prometeoService } = await applicationContext;

    const clients = await prometeoService.getClients({ key: payload.key });
    if (clients.length === 0) {
      log.error("no clients found from Prometeo API! returning HTTP 500");
      throw ServiceError.somethingWentWrong;
    }

    log.debug(`${clients.length} clients found from Prometeo API...`);

    const validClients = clients.map((c) => c.id);

    const apiError = validateSelectClientPayload(payload, validClients);
    if (apiError) {
      log.debug("request failed due to validation error...");
      throw apiError;
    }

    await prometeoService.selectClient(payload.key, payload.client);
  },
);
