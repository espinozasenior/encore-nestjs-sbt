import { api, type Header } from "encore.dev/api";

import type { PrometeoAPILoginRequestBody } from "./types/prometeo-api";
import type { UserBankAccount } from "./types/user-account";
import applicationContext from "../applicationContext";
import type { Supplier } from "./types/supplier";

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

// ! restrict access to internal level
export const login = api(
  { expose: true, method: "POST", path: "/third-party/prometeo/login" },
  async (payload: PrometeoAPILoginRequestBody): Promise<{ key: string }> => {
    const { prometeoService } = await applicationContext;

    const { key } = await prometeoService.login(payload);

    if (key.length !== 32) {
      log.warn(
        "generated Prometeo API session key is not 32 characters long, some anomalies may occur!",
      );
    }

    return { key };
  },
);

// ! restrict access to internal level
export const logout = api(
  { expose: true, method: "POST", path: "/third-party/prometeo/logout" },
  async (payload: { key: Header<"X-Prometeo-Session-Key"> }): Promise<{
    success: boolean;
  }> => {
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
    const { prometeoService } = await applicationContext;

    const data = await prometeoService.listUserAccounts(payload.key);

    return { data };
  },
);
