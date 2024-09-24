import { APIError } from "encore.dev/api";

export namespace ServiceError {
  export const sessionKeyInvalidOrExpired = APIError.permissionDenied(
    "Prometeo API' session key is invalid or expired",
  );

  export const wrongCredentials =
    APIError.permissionDenied("wrong credentials");

  export const unauthorizedProvider = APIError.permissionDenied(
    "unauthorized provider",
  );

  export const deadlineExceeded =
    APIError.deadlineExceeded("gateway timed out");

  export const somethingWentWrong = APIError.internal("something went wrong");
}
