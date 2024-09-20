import type {
  ILoginNeedsClientResponse,
  ILoginSuccessfulResponse,
} from "../interfaces/login-response.interface";
import type { IGetClientsResponse } from "../interfaces/get-clients-response.interface";

export type LoginResponse =
  | ILoginSuccessfulResponse
  | ILoginNeedsClientResponse;

export type GetClientsResponse = IGetClientsResponse;
