import { APIError } from "encore.dev/api";

export interface ISaveSunatProfileDto {
  account: string;
  solKey: string;
}

export const checkSaveSunatProfileDto = (
  dto: ISaveSunatProfileDto,
): APIError | null => {
  if (!dto.account) return APIError.invalidArgument("account is required");
  if (dto.account.length < 3) {
    return APIError.invalidArgument("account is too short");
  }

  if (!dto.solKey) return APIError.invalidArgument("solKey is required");

  return null;
};
