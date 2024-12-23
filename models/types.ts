import { CountriesType } from './countries';

export interface FiatCurrency {
	id: number;
	code: string;
	name: string;
	icon: string;
	country_code: CountriesType;
	symbol: string;
	allow_binance_rates: boolean;
	default_price_source: PriceSource;
}

export interface User {
	id: number;
	email: string;
	address: string;
	trades: number;
	image_url: string | null;
	name: string | null;
	twitter: string | null;
	completion_rate: number | null;
	createdAt: string;
	verified: boolean;
	contract_address: string | null;
	timezone: string | null;
	available_from: number | null;
	available_to: number | null;
	weekend_offline: boolean;
	online: boolean | null;
	telegram_user_id: string | null;
	telegram_username: string | null;
	unique_identifier: string | null;
	whatsapp_country_code: string | null;
	whatsapp_number: string | null;
}

export interface Token {
	id: number;
	address: string;
	decimals: number;
	chain_id: number;
	symbol: string;
	name: string;
	coingecko_id: string;
	icon: string;
	gasless: boolean;
	minimum_amount?: number;
	allow_binance_rates: boolean;
}

export type PriceSource = 'coingecko' | 'binance_median' | 'binance_min' | 'binance_max';

export interface List {
	id: number;
	automatic_approval: boolean;
	chain_id: number;
	fiat_currency: FiatCurrency;
	limit_min: number | null | undefined;
	limit_max: number | null | undefined;
	margin_type: 'fixed' | 'percentage';
	margin: number;
	seller: User;
	status: 'created' | 'active' | 'closed';
	terms: string | undefined | null;
	token: Token;
	payment_methods: PaymentMethod[];
	banks: Bank[];
	total_available_amount: string;
	price: number;
	type: 'SellList' | 'BuyList';
	deposit_time_limit: number | undefined;
	payment_time_limit: number | undefined;
	accept_only_verified: boolean;
	escrow_type: 'manual' | 'instant';
	contract: string | undefined;
	token_spot_price?: number;
	price_source: PriceSource;
	calculatedPrice: number;
}

export interface AccountField {
	type: 'text' | 'textarea' | 'message';
	id: string;
	label: string;
	placeholder: string;
	required: boolean;
}

export interface AccountFieldValue {
	[key: string]: string | undefined;
}

export interface Bank {
	id: number;
	name: string;
	color: string;
	account_info_schema: AccountSchema[];
	imageUrl: string;
	code?: string;
}

export interface AccountSchema {
	label: string;
	id: string;
	required: boolean;
	type?: string;
}

export interface PaymentMethod {
	id: number;
	bank: Bank;
	bank_id: number;
	values: AccountFieldValue;
}

export interface Escrow {
	id: number;
	order_id: number;
	tx: string;
	address: string;
	created_at: string;
}

export interface DisputeFile {
	id: number;
	upload_url: string;
	key: string;
	filename: string;
}

export interface UserDispute {
	id: number;
	comments: string;
	dispute_files: DisputeFile[];
}

export interface Dispute {
	id: number;
	resolved: boolean;
	winner: User | null;
	user_dispute: UserDispute;
	counterpart_replied: boolean;
}

export interface Order {
	id: number;
	fiat_amount: number;
	token_amount: number;
	price: number | undefined;
	list: List;
	seller: User;
	buyer: User;
	status: 'created' | 'escrowed' | 'release' | 'cancelled' | 'dispute' | 'closed';
	tx_hash: string | null | undefined;
	uuid: string;
	cancelled_at: string;
	escrow?: Escrow;
	dispute?: Dispute;
	created_at: string;
	payment_method: PaymentMethod;
	trade_id: string;
	deposit_time_limit: number | undefined;
	payment_time_limit: number;
	chain_id: number;
}

export interface Airdrop {
	buy_volume?: number;
	sell_volume?: number;
	points: number; // trade points
	liquidity_points: number; // trade points
	total: number;
}

export interface Contract {
	id: number;
	address: string;
	chain_id: number;
	version: string;
	locked_value: number | undefined;
}
