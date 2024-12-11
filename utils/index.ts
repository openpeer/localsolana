import { Network } from '@shyft-to/js';
import { UIList } from 'components/Listing/Listing.types';
import { List, Token } from 'models/types';
import snakecaseKeys from 'snakecase-keys';


export const smallWalletAddress = (address: string, length = 4): string =>
	`${address.substring(0, length)}..${address.substring(address.length - length)}`;

export const truncate = (num: number, places: number) => Math.trunc(num * 10 ** places) / 10 ** places;

export const DEFAULT_MARGIN_TYPE: List['margin_type'] = 'fixed';
export const DEFAULT_MARGIN_VALUE = 1;
export const DEFAULT_DEPOSIT_TIME_LIMIT = 60;
export const DEFAULT_PAYMENT_TIME_LIMIT = 1440;
export const DEFAULT_ESCROW_TYPE: List['escrow_type'] = 'instant';

export const listToMessage = (list: UIList): string => {
	//const chain = allChains.find((c) => c.id === list.chainId);
	const { type, token, currency, totalAvailableAmount, margin = 1, marginType, paymentMethods } = list;
	const action = type === 'BuyList' ? 'Buying' : 'Selling';
	const price =
		marginType === 'fixed'
			? `${currency?.name} ${margin.toFixed(2)} per ${token?.name}`
			: `Market price ${margin > 0 ? '+' : '-'} ${Math.abs(margin).toFixed(2)}%`;

	return JSON.stringify(
		snakecaseKeys(
			{
				network: 'Solana',
				token: `${action} ${(token as Token).symbol}`,
				currency: currency?.name,
				total: totalAvailableAmount,
				price,
				'Payment Methods': paymentMethods.map((p) => p.bank?.name).join(', ')
			},
			{ deep: true }
		),
		undefined,
		4
	);
};


  export const CURRENT_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || Network.Devnet; // Change this to MAINNET or LOCALNET as needed
  export const CURRENT_NETWORK_URL = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';
  export const BLOCK_EXPLORER = ['https://explorer.solana.com/'];

const ORDER_STATUS_MAPPING: { [key: number]: string } = {
	0: 'created',
	1: 'escrowed',
	2: 'release',
	3: 'cancelled',
	4: 'dispute',
	5: 'closed'
};

const LIST_STATUS_MAPPING: { [key: number]: string } ={
	0:'created',
	1:'activate',
	2:'closed'
}

export function getStatusStringList(status: number): string{
	return LIST_STATUS_MAPPING[status] || 'unknown';
}

export function getStatusString(status: number): string {
	return ORDER_STATUS_MAPPING[status] || 'unknown';
}


  // Reversing the ORDER_STATUS_MAPPING object
const ORDER_STATUS_MAPPING_TO_NUMBER: { [key: string]: number } = Object.fromEntries(
	Object.entries(ORDER_STATUS_MAPPING).map(([key, value]) => [value, Number(key)])
);

export const formatNumberWithCommas = (num: number): string => {
  // Handle edge cases
  if (isNaN(num) || !isFinite(num)) return '0.00';
  
  // Convert to fixed 2 decimal places and split into whole/decimal parts
  const parts = num.toFixed(2).split('.');
  
  // Add commas to the whole number part
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // Rejoin with decimal part
  return parts.join('.');
};

