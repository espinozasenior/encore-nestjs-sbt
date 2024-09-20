import { api, type Header } from "encore.dev/api";
import log from "encore.dev/log";

import type { IGetClientsResponse } from "./interfaces/get-clients-response.interface";
import type { PrometeoAPILoginRequestBody } from "./types/prometeo-api";
import type { UserBankAccount } from "./types/user-account";
import applicationContext from "../applicationContext";
import type { Supplier } from "./types/supplier";
import {
  validateGetClientsPayload,
  validateListUserAccountsPayload,
  validateLoginPayload,
  validateLogoutPayload,
} from "./validators/prometeo-api";
import type { LoginResponse } from "./types/response";

// If for any reason, the client will store the Prometeo API's session key,
// the header to pass it is "X-Prometeo-Session-Key"

export const getSuppliers = api(
  { expose: true, method: "GET", path: "/third-party/prometeo/suppliers" },
  async (): Promise<{ data: Supplier[] }> => {
    const { prometeoService } = await applicationContext;

    const data = await prometeoService.getSuppliers();

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

// ! restrict access to internal level
export const login = api(
  { expose: true, method: "POST", path: "/third-party/prometeo/login" },
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
  { expose: true, method: "POST", path: "/third-party/prometeo/logout" },
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
