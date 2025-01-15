// components/EscrowDepositWithdraw.tsx

import React, { useEffect, useState } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { Token } from 'models/types';
import { useQRCode } from 'next-qrcode';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useContractRead } from '@/hooks/transactions/useContractRead';
import HeaderH3 from './SectionHeading/h3';
import Switcher from './Button/Switcher';
import Input from './Input/Input';
import TokenImage from './Token/Token';
import Button from './Button/Button';
import Loading from './Loading/Loading';
import { CURRENT_NETWORK } from '@/utils';
import ClipboardText from './Buy/ClipboardText';
import DepositFunds from './DepositButton';
import WithdrawFundsButton from './WithdrawButton/WithdrawFundsButton';

interface EscrowDepositWithdrawProps {
	token: Token;
	contract: string;
	action: 'Deposit' | 'Withdraw';
	onBack: () => void;
	canDeposit: boolean;
	canWithdraw: boolean;
}

const EscrowDepositWithdraw = ({
	token,
	contract,
	action,
	onBack,
	canDeposit,
	canWithdraw
}: EscrowDepositWithdrawProps) => {
	const { SVG } = useQRCode();
	const { data, loading, error, tokenBalances, solBalance } = useContractRead(contract, "escrowState", true);
	const [type, setType] = useState<'Deposit' | 'Withdraw'>(action);
	const [depositAmount, setDepositAmount] = useState<number>();

	const deposit = type === 'Deposit';
	
	// Calculate balance based on token type (SOL or SPL)
	const balance = React.useMemo(() => {
		if (!token) return 0;
		
		try {
			if (token.address === PublicKey.default.toBase58()) {
				// For SOL, convert lamports to SOL
				return solBalance / LAMPORTS_PER_SOL;
			} else {
				// For SPL tokens
				const rawBalance = tokenBalances?.[token.address];
				if (!rawBalance) return 0;
				
				return parseFloat(rawBalance) / Math.pow(10, token.decimals || 6);
			}
		} catch (err) {
			console.error("[EscrowDepositWithdraw] Error calculating balance:", err);
			return 0;
		}
	}, [token, solBalance, tokenBalances]);

	useEffect(() => {
		if (canDeposit && !canWithdraw) {
			setType('Deposit');
		} else if (canWithdraw && !canDeposit) {
			setType('Withdraw');
		}
	}, [canDeposit, canWithdraw]);

	if (loading) {
		return <Loading />;
	}

	if (error) {
		return (
			<div className="px-6 w-full flex flex-col items-center mt-4 pt-4 md:pt-6 text-red-600">
				Error loading escrow state: {error}
			</div>
		);
	}

	if (!canDeposit && !canWithdraw) {
		return <Loading />;
	}

	const isValidAmount = (amount: number | undefined): boolean => {
		if (amount === undefined || amount <= 0) return false;
		if (type === 'Withdraw' && amount > balance) return false;
		return true;
	};

	return (
		<div className="px-6 w-full flex flex-col items-center mt-4 pt-4 md:pt-6 text-gray-700 relative">
			<div className="w-full lg:w-1/2 flex flex-col justify-between mb-16">
				<div className="flex flex-row space-x-4 items-center mb-2 cursor-pointer" onClick={onBack}>
					<ArrowLeftIcon className="w-4 h-4" /> <span className="text-sm">Back to Escrows</span>
				</div>
				<div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
					<HeaderH3 title={`${type} funds`} />
					{canDeposit === canWithdraw && (
						<Switcher
							leftLabel="Deposit"
							rightLabel="Withdraw"
							selected={type}
							onToggle={(t) => setType(t as 'Deposit' | 'Withdraw')}
						/>
					)}
				</div>
				<div className="flex flex-col border border-slate-300 mt-4 p-4 rounded">
					<div className="font-bold text-xl mb-2">
						{type} {token.symbol}
					</div>
					<div className="text-sm">
						<>
							{type} {token.name} {deposit ? 'into' : 'from'} your{' '}
							<a
								href={`https://explorer.solana.com/address/${contract}?cluster=${CURRENT_NETWORK}`}
								className="text-purple-900"
								target="_blank"
								rel="noreferrer"
							>
								LocalSolana Account.
							</a>
						</>
						{deposit ? (
							<span>
								The amount you deposit will be available for other traders to buy. You will have to
								acknowledge receipt of funds before escrowed crypto is released on any trade.
							</span>
						) : (
							<span>You can withdraw all your available funds at any time.</span>
						)}
					</div>
				
					<div className="flex flex-row justify-between text-sm py-4 border-b border-gray-200">
						<span>Asset</span>
						<div className="flex flex-row items-center space-x-1">
							<TokenImage token={token} size={20} />
							<span>{token.symbol}</span>
						</div>
					</div>
					<div className="flex flex-row justify-between text-sm py-4 border-b border-gray-200">
						<span>Available Balance</span>
						<div className="flex flex-row items-center space-x-1">
							<span className="font-bold">
								{balance.toFixed(token.decimals || 6)} {token.symbol}
							</span>
						</div>
					</div>
					<div className="flex flex-col space-y-2 justify-center items-center mt-2">
						<div className="w-full">
							<Input
								label="Amount"
								id="depositAmount"
								type="decimal"
								placeholder="1000"
								decimalScale={token.decimals}
								value={depositAmount}
								onChangeNumber={setDepositAmount}
								containerExtraStyle="mt-0 mb-2"
							/>
							{deposit ? (
								<DepositFunds
									contract={contract}
									token={token}
									tokenAmount={depositAmount!}
									disabled={!isValidAmount(depositAmount)}
									onFundsDeposited={onBack}
								/>
							) : (
								<WithdrawFundsButton
									contract={contract}
									token={token}
									tokenAmount={depositAmount!}
									disabled={!isValidAmount(depositAmount)}
									onFundsDWithdrawn={onBack}
								/>
							)}
						</div>
						<span className="text-sm text-gray-500">
							{type === 'Withdraw' && balance > 0 
								? `Maximum withdrawal amount: ${balance.toFixed(token.decimals || 6)} ${token.symbol}`
								: 'Available funds can be withdrawn at any time'}
						</span>
					</div>
					{deposit && (
						<div className="mt-8">
							<h2 className="block text-xl font-medium mb-1 font-bold my-8">
								{`or send ${token.symbol} from your exchange`}
							</h2>
							<div className="mt-2 mb-4 border border-gray-200 rounded-lg py-8 px-4 md:px-8 flex flex-col xl:flex-row items-center">
								<SVG
									text={contract}
									options={{
										errorCorrectionLevel: 'L',
										margin: 0,
										width: 200,
										quality: 1
									}}
								/>
								<div className="p-4">
									<div className="mb-4">
										<span className="font-bold">Send to Address</span>
										<ClipboardText itemValue={contract} extraStyle="break-all" />
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default EscrowDepositWithdraw;
