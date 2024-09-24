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

// If for any reason, the client will store the Prometeo API's session key,
// the header to pass it is "X-Prometeo-Session-Key"

export const selectClient = api(
  {
    expose: true,
    method: "POST",
    path: "/third-party/prometeo/select-client",
  },
  async (payload: {
    key: Header<"X-Prometeo-Session-Key">;
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

// ! restrict access to internal level
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

// ! restrict access to internal level
export const logout = api(
  { expose: true, method: "POST", path: "/third-party/prometeo/auth/logout" },
  async (payload: { key: Header<"X-Prometeo-Session-Key"> }): Promise<{
    success: boolean;
  }> => {
    const apiError = validateLogoutPayload(payload);
    if (apiError) throw apiError;

    const { prometeoService } = await applicationContext;

    const { success } = await prometeoService.logout(payload.key);

    return { success };
  },
);

export const listUserAccounts = api(
  { expose: true, method: "GET", path: "/third-party/prometeo/accounts" },
  async (payload: { key: Header<"X-Prometeo-Session-Key"> }): Promise<{
    data: UserBankAccount[];
  }> => {
    const apiError = validateListUserAccountsPayload(payload);
    if (apiError) throw apiError;

    const { prometeoService } = await applicationContext;

    const data = await prometeoService.listUserAccounts(payload.key);

    return { data };
  },
);

export const listUserAccountMovements = api(
  {
    expose: true,
    method: "GET",
    path: "/third-party/prometeo/accounts/:account/movements",
  },
  async (payload: {
    key: Header<"X-Prometeo-Session-Key">;
    account: string;
    currency: string;
    date_start: string;
    date_end: string;
  }): Promise<{
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

export const getSuppliers = api(
  { expose: true, method: "GET", path: "/third-party/prometeo/suppliers" },
  async (): Promise<{ data: Supplier[] }> => {
    const { prometeoService } = await applicationContext;

    log.debug("retrieving suppliers...");

    const data = await prometeoService.getSuppliers();

    log.debug(`${data.length} suppliers retrieved`);

    return { data };
  },
);

export const getClients = api(
  { expose: true, method: "GET", path: "/third-party/prometeo/clients" },
  async (payload: {
    key: Header<"X-Prometeo-Session-Key">;
  }): Promise<IGetClientsResponse> => {
    const { prometeoService } = await applicationContext;

    const apiError = validateGetClientsPayload(payload);
    if (apiError) throw apiError;

    const data = await prometeoService.getClients(payload);

    return { data };
  },
);
