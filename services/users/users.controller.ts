import { api, APIError } from "encore.dev/api";
import { auth } from "~encore/clients";
import log from "encore.dev/log";

import applicationContext from "@/services/applicationContext";
import type { SerializableUser } from "./interfaces/serializable-user.interface";
import { toSerializableUser } from "./helpers/serializable";
import { mustGetAuthData } from "@/lib/clerk";

interface Response {
  user: SerializableUser;
}

export const getUser = api(
  { expose: true, method: "GET", path: "/user", auth: true },
  async (): Promise<Response> => {
    const { usersService } = await applicationContext;
    const authenticatedUser = mustGetAuthData();

    const user = await usersService.findByClerkId(authenticatedUser.userID);
    if (!user) {
      throw APIError.notFound("user not found");
    }

    return { user: toSerializableUser(user) };
  },
);

export const createUser = api(
  { expose: true, method: "POST", path: "/user", auth: true },
  async ({
    acceptTermsAndPrivacyPolicy,
    acknowledgesLegalRepresentation,
  }: {
    acceptTermsAndPrivacyPolicy: boolean;
    acknowledgesLegalRepresentation: boolean;
  }): Promise<Response> => {
    const { usersService } = await applicationContext;
    const authenticatedUser = mustGetAuthData();

    const clerkId = authenticatedUser.userID;

    log.debug(
      `someone identified with clerk id '${clerkId}' wants to create its own user...`,
    );

    if (!acceptTermsAndPrivacyPolicy || !acknowledgesLegalRepresentation) {
      throw APIError.invalidArgument(
        "You must acknowledge the legal representation and accept the Terms of Service and Privacy Policy.",
      );
    }

    const alreadyExists = await usersService.existsByClerkId(
      authenticatedUser.userID,
    );
    if (alreadyExists) {
      throw APIError.alreadyExists("user already exists");
    }

    log.debug(
      `user identified with clerk id '${clerkId}' does not exist, creating...`,
    );

    const user = await usersService.create({
      clerkId,
      acknowledgesLegalRepresentation,
      acceptTermsAndPrivacyPolicy,
    });

    await auth.saveInternalUserIdInPublicMetadata({ clerkId, userId: user.id });

    return { user: toSerializableUser(user) };
  },
);

export const existsById = api(
  { expose: false },
  async ({
    id,
  }: { id: number }): Promise<{
    userExists: boolean;
  }> => {
    const { usersService } = await applicationContext;

    const userExists = await usersService.existsById(id);

    return {
      userExists,
    };
  },
);
