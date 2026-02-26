export type StoreSettingsData = {
  settingId?: number;
  businessName: string;
  businessTagline: string | null;
  gstin: string | null;
  pan: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string;
  state: string;
  stateCode: string;
  pincode: string | null;
  country: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  gstRate: string;
  hsnCode: string;
  enableGst: boolean;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  invoiceTerms: string | null;
  invoiceNotes: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankBranch: string | null;
  upiId: string | null;
  // Bill layout customization
  billPaperSize: string;
  billAccentColor: string;
  billTitle: string;
  billHeaderText: string | null;
  billFooterText: string | null;
  billGreeting: string | null;
  billLogoUrl: string | null;
  billShowLogo: boolean;
  billShowHsn: boolean;
  billShowSku: boolean;
  billShowGstSummary: boolean;
  billShowBankDetails: boolean;
  billShowSignatory: boolean;
  billShowAmountWords: boolean;
  billShowCustomerSection: boolean;
  billFontScale: string;
};

export const defaultSettings: StoreSettingsData = {
  businessName: "LookKool",
  businessTagline: "",
  gstin: "",
  pan: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "Tamil Nadu",
  stateCode: "33",
  pincode: "",
  country: "India",
  phone: "",
  email: "",
  website: "",
  gstRate: "5.00",
  hsnCode: "6104",
  enableGst: true,
  invoicePrefix: "LK",
  nextInvoiceNumber: 1,
  invoiceTerms: "",
  invoiceNotes: "",
  bankName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankBranch: "",
  upiId: "",
  // Bill layout defaults
  billPaperSize: "A4",
  billAccentColor: "#470B49",
  billTitle: "TAX INVOICE",
  billHeaderText: "",
  billFooterText: "",
  billGreeting: "",
  billLogoUrl: "",
  billShowLogo: false,
  billShowHsn: true,
  billShowSku: true,
  billShowGstSummary: true,
  billShowBankDetails: true,
  billShowSignatory: true,
  billShowAmountWords: true,
  billShowCustomerSection: true,
  billFontScale: "1.00",
};

export type SectionProps = {
  form: StoreSettingsData;
  update: (field: keyof StoreSettingsData, value: string | boolean | number) => void;
};
