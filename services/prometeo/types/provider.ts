interface AuthFieldWithChoices {
  name: string;
  type: "choice";
  interactive: boolean;
  optional: boolean;
  label_es: string;
  label_en: string;
  choices: {
    name: string;
    label_es: string;
    label_en: string;
  }[];
}

interface AuthFieldDocumentTypeWithChoices {
  name: "type";
  type: "choice";
  interactive: boolean;
  optional: boolean;
  label_es: string;
  label_en: "Document type";
  choices: {
    name: "DNI" | "CE" | "PAS" | "CARD";
    label_es: string;
    label_en: string;
  }[];
}

interface RegularAuthField {
  name: string;
  type: "text" | "password";
  interactive: boolean;
  optional: boolean;
  label_es: string;
  label_en: string;
}

type AuthField =
  | RegularAuthField
  | AuthFieldWithChoices
  | AuthFieldDocumentTypeWithChoices;

interface BankMetadata {
  code: string;
  name: string;
  logo: string;
}

interface AccountType {
  name: string;
  label_es: string;
  label_en: string;
}

export interface Provider {
  name: string;
  aliases: string[];
  country: string;
  auth_fields: AuthField[];
  // endpoints_status?: any;
  account_type: AccountType[];
  logo: string;
  bank: BankMetadata;
  methods: {
    accounts: boolean;
    credit_cards: boolean;
    account_movements: boolean;
    credit_card_movements: boolean;
    personal_info: boolean;
    transfers: boolean;
    enrollments: boolean;
  };
}
