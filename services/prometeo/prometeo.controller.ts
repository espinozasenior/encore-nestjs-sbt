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
