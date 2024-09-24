import type { UserBankAccount, UserBankAccountMovement } from "./user-account";

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

/**
 * URL: https://banking.prometeoapi.net/login/
 *
 * Login
 * https://docs.prometeoapi.com/reference/login
 */
export interface PrometeoAPISuccessfulLoginResponse {
  status: "logged_in";
  key: string;
}

export interface PrometeoAPILoginSelectClientResponse {
  status: "select_client";
  key: string;
}

export interface PrometeoAPILoginRequiresPersonalQuestionResponse {
  status: "interaction_required";
  field: "personal_questions";
  context: string;
  key: string;
}

export interface PrometeoAPILoginRequiresOTPResponse {
  status: "interaction_required";
  field: "otp";
  context: string;
  key: string;
}

export type PrometeoAPILoginAcceptableResponse =
  | PrometeoAPISuccessfulLoginResponse
  | PrometeoAPILoginSelectClientResponse
  | PrometeoAPILoginRequiresPersonalQuestionResponse
  | PrometeoAPILoginRequiresOTPResponse;

export type PrometeoAPILoginResponse =
  | PrometeoAPILoginAcceptableResponse
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

export type PrometeoAPISelectClientResponse =
  | PrometeoAPISelectClientSuccessfulResponse
  | PrometeoAPISelectClientWrongResponse
  | PrometeoAPIErrorInvalidKeyResponse;

export interface PrometeoAPISelectClientSuccessfulResponse {
  status: "success";
}

export interface PrometeoAPISelectClientWrongResponse {
  status: "error";
  message: "wrong_client";
}

export interface PrometeoAPIListUserAccountMovementsPayload {
  key: string;
  account: string;
  currency: string;
  date_start: string;
  date_end: string;
}

export type PrometeoAPIListUserAccountMovementsResponse =
  | PrometeoAPIListUserAccountMovementsSuccessfulResponse
  | PrometeoAPIErrorInvalidKeyResponse;

export interface PrometeoAPIListUserAccountMovementsSuccessfulResponse {
  status: "success";
  movements: UserBankAccountMovement[];
}
