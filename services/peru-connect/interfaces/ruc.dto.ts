import type { LegalRepresentativeDto } from "./legal-representatives.dto";

export interface RucDto {
  ruc: string;
  names: string;
  department: string;
  province: string;
  district: string;
  address: string;
  fullAddress: string;
  sunatGeoLocationCode: string;
  geoLocation: string[];
  status: string;
  condition: string;
  isARetentionAgent: string;
  isAGoodTaxPayer: string;
  // biome-ignore lint/suspicious/noExplicitAny: not able to introspect the type
  attachments: any[];
  representatives?: LegalRepresentativeDto[];
}
