export interface LegalRepresentativesDto {
  document: {
    type: string;
    number: string;
  };
  names: string;
  role: string;
  since: string;
}
