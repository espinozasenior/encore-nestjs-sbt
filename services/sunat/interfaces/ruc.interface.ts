import type { LegalRepresentativeDto } from "./legal-representative.interface";

export interface IRUC {
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
