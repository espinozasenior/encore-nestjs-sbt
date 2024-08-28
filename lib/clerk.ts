import type { AuthenticatedUser } from "@/services/auth/interfaces/clerk.interface";
import { getAuthData } from "~encore/auth";

export const mustGetAuthData = (): AuthenticatedUser => {
  const user = getAuthData();
  if (!user) {
    throw new Error("User not authenticated");
  }

  return user;
};
