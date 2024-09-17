interface SupplierAuthField {
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

interface SupplierBankMetadata {
  code: string;
  name: string;
  logo: string;
}

interface SupplierAccountType {
  name: string;
  label_es: string;
  label_en: string;
}

export interface Supplier {
  name: string;
  aliases: string[];
  country: string;
  auth_fields: SupplierAuthField[];
  // endpoints_status?: any;
  account_type: SupplierAccountType[];
  logo: string;
  bank: SupplierBankMetadata;
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
