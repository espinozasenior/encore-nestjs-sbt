export interface LegalRepresentativeDto {
  document: {
    type: string;
    number: string;
  };
  names: string;
  role: string;
  since: string;
}
