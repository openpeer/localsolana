
import { Token } from 'models/types';

export interface WithdrawFundsButtonProps {
	token: Token;
	tokenAmount: number;
	contract: string;
	disabled?: boolean;
    onFundsDWithdrawn: () => void; 
}