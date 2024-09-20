import type { UserBankAccount } from "./user-account";

export interface PrometeoAPILoginRequestBody {
  provider: string;
  username: string;
  password: string;
  type?: string;
  otp?: string;
}

export interface PrometeoAPIGenericErrorResponse {
  status: "error";
  message: string & {};
}

export interface PrometeoAPIErrorUnathorizedProviderResponse {
  status: "error";
  message: "Unauthorized provider";
}

export interface PrometeoAPIErrorWrongCredentialsResponse {
  status: "wrong_credentials";
}

export type PrometeoAPIErrorLoginResponse =
  | PrometeoAPIErrorWrongCredentialsResponse
  | PrometeoAPIErrorUnathorizedProviderResponse
  | PrometeoAPIGenericErrorResponse;

export interface PrometeoAPIErrorInvalidKeyResponse {
  status: "error";
  message: "Invalid key";
}

export interface PrometeoAPIErrorMissingAPIKeyResponse {
  status: "error";
  message: "Missing API key";
}

export interface PrometeoAPIErrorAPIKeyNotFoundResponse {
  status: "error";
  message: "Key not Found";
}

export interface PrometeoAPIIncompleteLoginResponse {
  status: "interaction_required";
  context: string;
}

export interface PrometeoAPISuccessfulLoginResponse {
  status: "logged_in";
  key: string;
}

export type PrometeoAPILoginResponse =
  | PrometeoAPISuccessfulLoginResponse
  | PrometeoAPIIncompleteLoginResponse
  | PrometeoAPIErrorLoginResponse;

export interface PrometeoAPISuccessfulLogoutResponse {
  status: "logged_out";
}

export type PrometeoAPILogoutResponse =
  | PrometeoAPISuccessfulLogoutResponse
  | PrometeoAPIErrorLoginResponse;

export interface PrometeoAPISuccessfulListUserAccountsResponse {
  status: "success";
  accounts: UserBankAccount[];
}

export type PrometeoAPIListUserAccountsResponse =
  | PrometeoAPISuccessfulListUserAccountsResponse
  | PrometeoAPIErrorInvalidKeyResponse;

/**
 * URL: https://banking.prometeoapi.net/client/
 *
 * Get clients
 */
export interface PrometeoAPIGetClientsPayload {
  key: string;
}

export interface PrometeoAPIGetClientsSuccessfulResponse {
  status: "success";
  clients: { [key: string]: string };
}

export type PrometeoAPIGetClientsErrorResponse =
  | PrometeoAPIErrorInvalidKeyResponse
  | PrometeoAPIErrorMissingAPIKeyResponse
  | PrometeoAPIErrorAPIKeyNotFoundResponse
  | PrometeoAPIGenericErrorResponse;

export type PrometeoAPIGetClientsResponse =
  | PrometeoAPIGetClientsSuccessfulResponse
  | PrometeoAPIGetClientsErrorResponse;
