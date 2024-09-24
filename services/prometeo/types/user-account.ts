export interface UserBankAccount {
  id: string;
  name: string;
  number: string;
  branch: string;
  currency: string;
  balance: number;
}

export interface UserBankAccountMovement {
  id: string;
  reference: string;
  date: string;
  detail: string;
  debit: string;
  credit: number;
  // biome-ignore lint/suspicious/noExplicitAny: not able to introspect the type
  extra_data: any;
}
