import { APIError } from "encore.dev/api";

import type {
  PrometeoAPIGetClientsPayload,
  PrometeoAPILoginRequestBody,
} from "../types/prometeo-api";

const checkNonEmptyString = (
  fieldName: string,
  value: string,
  minSize: number,
  maxSize: number,
): APIError | undefined => {
  if (!value) {
    return APIError.invalidArgument(`'${fieldName}' is required`);
  }

  if (typeof value !== "string") {
    return APIError.invalidArgument("'value' must be a string value");
  }

  if (minSize === maxSize && value.length !== minSize) {
    return APIError.invalidArgument(
      `'${fieldName}' must be exactly ${minSize} characters long`,
    );
  }

  if (value.length < minSize) {
    return APIError.invalidArgument(
      `'${fieldName}' must be at least ${minSize} characters long`,
    );
  }

  if (value.length > maxSize) {
    return APIError.invalidArgument(
      `'${fieldName}' must be at most ${maxSize} characters long`,
    );
  }
};

const checkPrometeoSessionKey = (key: string): APIError | undefined => {
  const error = checkNonEmptyString("key", key, 32, 32);
  if (error) return error;
};

export const validateGetClientsPayload = (
  payload: PrometeoAPIGetClientsPayload,
): APIError | undefined => {
  const error = checkPrometeoSessionKey(payload.key);
  if (error) return error;
};

export const validateLogoutPayload = (payload: { key: string }):
  | APIError
  | undefined => {
  const error = checkPrometeoSessionKey(payload.key);
  if (error) return error;
};

export const validateListUserAccountsPayload = (payload: { key: string }):
  | APIError
  | undefined => {
  const error = checkPrometeoSessionKey(payload.key);
  if (error) return error;
};

// https://docs.prometeoapi.com/reference/login
export const validateLoginPayload = (
  payload: PrometeoAPILoginRequestBody,
  validProviders: string[],
): APIError | undefined => {
  let error = checkNonEmptyString("provider", payload.provider, 3, 255);
  if (error) return error;

  // only allow this when using sandbox
  if (payload.provider !== "test") {
    const isValidProvider = validProviders.includes(payload.provider);
    if (!isValidProvider) {
      return APIError.invalidArgument("specified provider is not valid");
    }
  }

  error = checkNonEmptyString("username", payload.username, 4, 255);
  if (error) return error;

  error = checkNonEmptyString("password", payload.password, 4, 255);
  if (error) return error;

  // TODO: check 'type' (depends on provider)
};
