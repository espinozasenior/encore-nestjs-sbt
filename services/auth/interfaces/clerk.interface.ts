interface IVerification {
  readonly status: string;
  readonly strategy: string;
  // readonly externalVerificationRedirectURL: URL | null;
  readonly attempts: number | null;
  readonly expireAt: number | null;
  readonly nonce: string | null;
}

interface Web3Wallet {
  readonly id: string;
  readonly web3Wallet: string;
  readonly verification: IVerification | null;
}

interface IIdentificationLink {
  readonly id: string;
  readonly type: string;
}

interface IEmailAddress {
  readonly id: string;
  readonly emailAddress: string;
  readonly verification: IVerification | null;
  readonly linkedTo: IIdentificationLink[];
}

interface IPhoneNumber {
  readonly id: string;
  readonly phoneNumber: string;
  readonly reservedForSecondFactor: boolean;
  readonly defaultSecondFactor: boolean;
  readonly verification: IVerification | null;
  readonly linkedTo: IIdentificationLink[];
}

interface ExternalAccount {
  readonly id: string;
  readonly provider: string;
  readonly identificationId: string;
  readonly externalId: string;
  readonly approvedScopes: string;
  readonly emailAddress: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly imageUrl: string;
  readonly username: string | null;
  readonly publicMetadata: Record<string, unknown> | null;
  readonly label: string | null;
  readonly verification: IVerification | null;
}

interface ISamlAccount {
  readonly id: string;
  readonly provider: string;
  readonly providerUserId: string | null;
  readonly active: boolean;
  readonly emailAddress: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly verification: IVerification | null;
}

interface IUser {
  readonly id: string;
  readonly passwordEnabled: boolean;
  readonly totpEnabled: boolean;
  readonly backupCodeEnabled: boolean;
  readonly twoFactorEnabled: boolean;
  readonly banned: boolean;
  readonly locked: boolean;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly imageUrl: string;
  readonly hasImage: boolean;
  readonly primaryEmailAddressId: string | null;
  readonly primaryPhoneNumberId: string | null;
  readonly primaryWeb3WalletId: string | null;
  readonly lastSignInAt: number | null;
  readonly externalId: string | null;
  readonly username: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly publicMetadata: { [k: string]: unknown };
  readonly privateMetadata: { [k: string]: unknown };
  readonly unsafeMetadata: { [k: string]: unknown };
  readonly emailAddresses: IEmailAddress[];
  readonly phoneNumbers: IPhoneNumber[];
  readonly web3Wallets: Web3Wallet[];
  readonly externalAccounts: ExternalAccount[];
  readonly samlAccounts: ISamlAccount[];
  readonly lastActiveAt: number | null;
  readonly createOrganizationEnabled: boolean;
  readonly createOrganizationsLimit: number | null;
}

export interface AuthenticatedUser {
  userID: string;
  metadata: IUser;
}
