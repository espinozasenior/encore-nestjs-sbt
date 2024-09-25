import { APIError } from "encore.dev/api";
import log from "encore.dev/log";

import type { ISetupProviderAccessInputDto } from "../dtos/setup-provider.dto";
import type { Provider } from "../../prometeo/types/provider";
import { ServiceError } from "../service-errors";

export const validatePrometeoProviderAccessInputs = (
  inputs: ISetupProviderAccessInputDto,
  selectedProvider: Provider,
): APIError | undefined => {
  if (!selectedProvider.auth_fields) {
    log.error(
      `no auth fields supplied by provider ${inputs.prometeo_provider}`,
    );

    return ServiceError.somethingWentWrong;
  }

  // We're relying a lot on these fields.
  if (!inputs.credentials.username) {
    return APIError.invalidArgument('missing "username" in credentials field');
  }

  if (!inputs.credentials.password) {
    return APIError.invalidArgument('missing "password" in credentials field');
  }

  const { additionalFields = {} } = inputs.credentials;

  for (const authField of selectedProvider.auth_fields) {
    const alreadyHandled =
      authField.name === "username" || authField.name === "password";
    if (alreadyHandled) continue;

    const entry = additionalFields[authField.name];
    if (entry === undefined) {
      if (!authField.optional) {
        return APIError.invalidArgument(
          `missing credentials field '${authField.name}'`,
        );
      }

      log.warn(
        `missing credentials field '${authField.name}' but that field is optional`,
      );

      continue;
    }

    if (entry.length < 1) {
      return APIError.invalidArgument(
        `no value provided for field '${authField.name}'`,
      );
    }

    if (entry.length > 50) {
      return APIError.invalidArgument(
        `value at field '${authField.name}' is too long when max are 50 characters`,
      );
    }

    if (authField.type === "choice") {
      const foundIndex = authField.choices.findIndex(
        (choice) => choice.name === entry,
      );
      if (foundIndex === -1) {
        return APIError.invalidArgument(
          `invalid choice for field '${authField.name}'`,
        );
      }
    }
  }
};
