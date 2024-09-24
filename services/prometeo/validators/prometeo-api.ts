import { APIError } from "encore.dev/api";
import { isMatch } from "date-fns";

import type {
  PrometeoAPIGetClientsPayload,
  PrometeoAPIListUserAccountMovementsPayload,
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

export const validateSelectClientPayload = (
  payload: {
    key: string;
    client: string;
  },
  validClients: string[],
): APIError | undefined => {
  const error = checkPrometeoSessionKey(payload.key);
  if (error) return error;

  if (!validClients.includes(payload.client)) {
    return APIError.notFound(
      `specified client '${payload.client}' does not exist`,
    );
  }
};

export const validateListUserAccountMovementsPayload = (
  payload: PrometeoAPIListUserAccountMovementsPayload,
): APIError | undefined => {
  let error = checkNonEmptyString("currency", payload.currency, 3, 3);
  if (error) return error;

  const rxISO4217 = /^[A-Z]{3}$/;

  if (!rxISO4217.test(payload.currency)) {
    return APIError.invalidArgument(
      `'${payload.currency}' is not a valid ISO 4217 currency code`,
    );
  }

  error = checkNonEmptyString("date_start", payload.date_start, 10, 10);
  if (error) return error;

  const dateFormat = "dd/MM/yyyy";

  if (!isMatch(payload.date_start, dateFormat)) {
    return APIError.invalidArgument(
      `'date_start' must be in this format: ${dateFormat}`,
    );
  }

  error = checkNonEmptyString("date_end", payload.date_end, 10, 10);
  if (error) return error;

  if (!isMatch(payload.date_end, dateFormat)) {
    return APIError.invalidArgument(
      `'date_end' must be in this format: ${dateFormat}`,
    );
  }
};
