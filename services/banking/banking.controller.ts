import { api } from "encore.dev/api";

import type { ISetupProviderAccessInputDto } from "./dtos/setup-provider.dto";
import type { SetupProviderAccessResponse } from "./types/response";
import applicationContext from "../applicationContext";
import log from "encore.dev/log";

/**
 * We mainly need two things:
 * - Bank account number (would vary depending on the bank)
 * - Banking credentials (will vary depending on the bank)
 *
 * Only the final digits of the account number, the alias and the provider should
 * be exposed to the user.
 *
 * We need a mechanism to notify the users about the status of their account linking.
 *
 * So if the case above happens, some services might be inactive until the user re-issues its accounts.
 */

export const setupProviderAccess = api(
  {
    expose: true,
    method: "POST",
    path: "/banking/providers/setup-access",
  },
  async (
    payload: ISetupProviderAccessInputDto,
  ): Promise<SetupProviderAccessResponse> => {
    // const clerkUser = mustGetAuthData();

    log.debug(
      "received request to setup a provider...", // from user with clerk id '${clerkUser.userID}'...`,
    );

    const { bankingService } = await applicationContext;

    const result = await bankingService.setupPrometeoProviderAccess(payload);

    return {
      issuedProviderAccess: {
        id: result.id,
        name: result.providerName,
      },
    };
  },
);
