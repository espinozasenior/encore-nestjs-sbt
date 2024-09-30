import { APIError } from "encore.dev/api";

export namespace ServiceError {
  export const somethingWentWrong = APIError.internal("something went wrong");
}
