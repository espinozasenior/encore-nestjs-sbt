export interface PrometeoAPILoginRequestBody {
  provider: string;
  username: string;
  password: string;
  type?: string;
}

export interface PrometeoAPIErrorLoginResponse {
  status: "error";
  message: string;
}

export interface PrometeoAPISuccessfulLoginResponse {
  status: "logged_in";
  key: string;
}

export type PrometeoAPILoginResponse =
  | PrometeoAPISuccessfulLoginResponse
  | PrometeoAPIErrorLoginResponse;

export interface PrometeoAPISuccessfulLogoutResponse {
  status: "logged_out";
}

export type PrometeoAPILogoutResponse =
  | PrometeoAPISuccessfulLogoutResponse
  | PrometeoAPIErrorLoginResponse;
