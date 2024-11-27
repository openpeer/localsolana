import { Network } from '@shyft-to/js';
import { UIList } from 'components/Listing/Listing.types';
import { List, Token } from 'models/types';
import snakecaseKeys from 'snakecase-keys';

// Basic utilities
export const smallWalletAddress = (address?: string): string => {
  if (!address) return '';
  return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
};

export const truncate = (num: number, places: number) => Math.trunc(num * 10 ** places) / 10 ** places;

// Default values for business logic
export const DEFAULT_MARGIN_TYPE: List['margin_type'] = 'fixed';
export const DEFAULT_MARGIN_VALUE = 1;
export const DEFAULT_DEPOSIT_TIME_LIMIT = 60;
export const DEFAULT_PAYMENT_TIME_LIMIT = 1440;
export const DEFAULT_ESCROW_TYPE: List['escrow_type'] = 'instant';

// Solana/Helius Configuration
export const NEXT_PUBLIC_SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
export const NEXT_PUBLIC_SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC;
export const NEXT_PUBLIC_BLOCK_EXPLORER_URL = process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL;

// Shyft Configuration
export const NEXT_PUBLIC_SHYFT_API_KEY = process.env.NEXT_PUBLIC_SHYFT_API_KEY;
export const NEXT_PUBLIC_SHYFT_MAINNET_RPC = process.env.NEXT_PUBLIC_SHYFT_MAINNET_RPC;
export const NEXT_PUBLIC_SHYFT_DEVNET_RPC = process.env.NEXT_PUBLIC_SHYFT_DEVNET_RPC;
export const NEXT_PUBLIC_SHYFT_TESTNET_RPC = process.env.NEXT_PUBLIC_SHYFT_TESTNET_RPC;

// Status mappings
const ORDER_STATUS_MAPPING: { [key: number]: string } = {
  0: 'created',
  1: 'escrowed',
  2: 'release',
  3: 'cancelled',
  4: 'dispute',
  5: 'closed'
};

const LIST_STATUS_MAPPING: { [key: number]: string } = {
  0: 'created',
  1: 'activate',
  2: 'closed'
};

// Helper functions
export const listToMessage = (list: UIList): string => {
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

export function getStatusStringList(status: number): string {
  return LIST_STATUS_MAPPING[status] || 'unknown';
}

export function getStatusString(status: number): string {
  return ORDER_STATUS_MAPPING[status] || 'unknown';
}

export const ORDER_STATUS_MAPPING_TO_NUMBER: { [key: string]: number } = Object.fromEntries(
  Object.entries(ORDER_STATUS_MAPPING).map(([key, value]) => [value, Number(key)])
);