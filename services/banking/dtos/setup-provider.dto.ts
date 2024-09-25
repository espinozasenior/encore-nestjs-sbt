import type { PrometeoCredentials } from "../types/prometeo-credentials";

export interface ISetupProviderAccessInputDto {
  prometeo_provider: string;
  credentials: PrometeoCredentials;
}
