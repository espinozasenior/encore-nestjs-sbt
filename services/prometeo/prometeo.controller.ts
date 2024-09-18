import { api } from "encore.dev/api";

import applicationContext from "../applicationContext";
import type { Supplier } from "./types/supplier";

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
  async (payload: {
    provider: string;
    username: string;
    password: string;
  }): Promise<{ key: string }> => {
    const { prometeoService } = await applicationContext;

    const { key } = await prometeoService.login(payload);

    return { key };
  },
);
