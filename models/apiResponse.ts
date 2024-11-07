// models/apiResponse.ts

export interface UserData {
  address: string;
  available_from: number | null; // Changed to number | null
  available_to: number | null; // Changed to number | null
  contract_address: string;
  createdAt: string;
  email: string;
  id: string;
  image_url: string;
  merchant: boolean;
  name: string;
  timezone: string;
  twitter: string;
  updatedAt: string;
  verified: boolean;
  weekend_offline: boolean;
  telegram_user_id: string | null;
  telegram_username: string | null;
  whatsapp_country_code: string | null;
  whatsapp_number: string | null;
  trades: number;
  completion_rate: number | null;
  online: boolean | null;
  unique_identifier: string | null;
}

export interface UserResponse {
  status: number;
  code: number;
  message: string;
  data: UserData;
  env: string;
}