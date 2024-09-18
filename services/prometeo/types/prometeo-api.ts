import type { UserBankAccount } from "./user-account";

export interface PrometeoAPILoginRequestBody {
  provider: string;
  username: string;
  password: string;
  type?: string;
  otp?: string;
}

export interface PrometeoAPIErrorLoginResponse {
  status: "error";
  message: string;
}

export interface PrometeoAPIErrorInvalidKeyResponse {
  status: "error";
  message: "Invalid key";
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
