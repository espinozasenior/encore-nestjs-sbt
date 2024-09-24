interface ProviderAuthField {
  name: string;
  type: "text" | "password" | "choice";
  interactive: boolean;
  optional: boolean;
  label_es: string;
  label_en: string;
  choices?: {
    name: string;
    label_es: string;
    label_en: string;
  }[];
}

interface ProviderBankMetadata {
  code: string;
  name: string;
  logo: string;
}

interface ProviderAccountType {
  name: string;
  label_es: string;
  label_en: string;
}

export interface Provider {
  name: string;
  aliases: string[];
  country: string;
  auth_fields: ProviderAuthField[];
  // endpoints_status?: any;
  account_type: ProviderAccountType[];
  logo: string;
  bank: ProviderBankMetadata;
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
