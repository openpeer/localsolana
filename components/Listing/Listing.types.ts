import { Option } from 'components/Select/Select.types';
import { Bank, List, PaymentMethod, PriceSource, User } from 'models/types';

export interface UIPaymentMethod {
	id?: number;
	bank?: Bank;
	values: Record<string, string>;
	payment_method_id?: string;
	bank_id?: string;
	color?: string;
	name?: string;
	account_info_schema?: Array<{
		label: string;
		id: string;
		required: boolean;
	}>;
	image?: string;
	imageUrl?: string;
}

export interface BankPaymentMethod {
	bank: Bank;
	bank_id: string;
	values: Record<string, string>;
}

export type DirectPaymentMethod = {
	payment_method_id: string;
	bank: Bank;
	values: Record<string, string>;
};

export interface UIList {
	id: number | undefined;
	type: 'BuyList' | 'SellList';
	step: number;
	token: Option | undefined;
	tokenId: number | undefined;
	currency: Option | undefined;
	fiatCurrencyId: number | undefined;
	totalAvailableAmount: number | undefined;
	marginType: List['margin_type'];
	calculatedPrice?: number;
	margin: number | undefined;
	limitMin: number | null;
	limitMax: number | null;
	paymentMethods: UIPaymentMethod[];
	terms?: string | undefined;
	user?: User;
	depositTimeLimit: number;
	paymentTimeLimit: number;
	chainId: number;
	acceptOnlyVerified: boolean;
	escrowType: List['escrow_type'];
	banks: Bank[];
	priceSource: PriceSource | undefined;
	price?: number;
}

export interface ListStepProps {
	list: UIList;
	updateList: (t: UIList) => void;
}

export interface SetupListStepProps extends ListStepProps {
	tokenId: string | string[] | undefined;
	currencyId: string | string[] | undefined;
}

export interface AmountStepProps extends ListStepProps {
	tokenAmount: string | string[] | undefined;
}
