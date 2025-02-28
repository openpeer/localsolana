import { Token } from 'models/types';
import { useQRCode } from 'next-qrcode';
import { useState, useEffect } from 'react';
import ClipboardText from 'components/Buy/ClipboardText';
import DeploySellerContract from 'components/Buy/EscrowButton/DeploySellerContract';
import Input from 'components/Input/Input';
import DepositFunds from 'components/DepositButton';
import { useAccount, useUserProfile } from '@/hooks';
import { BLOCK_EXPLORER, CURRENT_NETWORK } from '@/utils';
import StepLayout from './StepLayout';
import { useContractRead } from '@/hooks/transactions/useContractRead';

interface FundsEscrowProps {
	token: Token;
	sellerContract: string | null | undefined;
	chainId: number;
	balance: number;
	totalAvailableAmount: number;
}

const FundEscrow = ({ token, sellerContract, chainId, balance, totalAvailableAmount }: FundsEscrowProps) => {
	const listTotal = totalAvailableAmount;
	const listTotalNumber = listTotal - balance;
	const toDeposit = listTotalNumber / 4;
	const [depositAmount, setDepositAmount] = useState<number | undefined>(listTotalNumber);
	const [isContractReady, setIsContractReady] = useState(false);
	const { SVG } = useQRCode();
	const { address } = useAccount();
	const { user, updateContractAddress } = useUserProfile({});

	const handleContractUpdate = async (contractAddress: string | undefined) => {
		if (contractAddress) {
			await updateContractAddress(contractAddress);
			// Wait for contract to be ready before setting state
			await new Promise(resolve => setTimeout(resolve, 2000));
			setIsContractReady(true);
		}
	};

	const { data: escrowState, error: escrowError } = useContractRead(
		address || '',
		"escrowState",
		true
	);

	useEffect(() => {
		if (escrowState) {
			setIsContractReady(true);
		}
	}, [escrowState]);

	const sellerContractDeployed = isContractReady && escrowState != undefined;

	function handleFundsDeposited(): void {
		
	}

	return (
		<StepLayout buttonText={`Deposit ${token.name}`}>
			<div className="my-4">
				<div className="text-sm bg-gray-200 rounded-lg p-4 py-3 mb-4 flex flex-row justify-between">
					<span>Balance Summary</span>
					<span>
						{balance} {token.symbol}
					</span>
				</div>
				<h2 className="block text-xl font-medium mb-1 font-bold">
					{`${sellerContractDeployed ? 'Fund' : 'Create'} Escrow Account`}
				</h2>
				<div className="mb-4">
					<div className="text-sm text-gray-600 mb-4">
						{sellerContractDeployed && (
							<>
								Deposit {token.name} into your{' '}
								<a
									href={`${BLOCK_EXPLORER[0]}/address/${sellerContract}?cluster=${CURRENT_NETWORK}`}
									className="text-purple-900"
									target="_blank"
									rel="noreferrer"
								>
									LocalSolana Account.
								</a>
							</>
						)}
						The amount you deposit will be available for other traders to buy. You will have to acknowledge
						receipt of funds before escrowed crypto is released on any trade.
					</div>
					<div className="flex flex-col space-y-2 justify-center items-center">
						{sellerContractDeployed ? (
							<div className="w-full">
								<Input
									label="Amount"
									id="depositAmount"
									type="decimal"
									placeholder="0.0"
									decimalScale={token.decimals}
									value={depositAmount}
									onChangeNumber={setDepositAmount}
									containerExtraStyle="mt-0 mb-2"
								/>
								{depositAmount && depositAmount >= toDeposit && (
									<DepositFunds
										contract={user?.contract_address || ''}
										token={token}
										tokenAmount={depositAmount}
										disabled={!isContractReady}
										onFundsDeposited={handleFundsDeposited}
									/>
								)}
							</div>
						) : (
							<DeploySellerContract setContractAddress={handleContractUpdate} />
						)}
						<span className="text-sm text-gray-500">
							Available funds can be withdrawn at any time
						</span>
					</div>
					{sellerContractDeployed && (
						<div className="mt-8">
							<h2 className="block text-xl font-medium mb-1 font-bold my-8">
								{`or send ${token.symbol} from your exchange`}
							</h2>
							<div className="mt-2 mb-4 border border-gray-200 rounded-lg py-8 px-4 md:px-8  flex flex-col xl:flex-row items-center">
								<SVG
									text={address || ''}
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
										<ClipboardText itemValue={address || ''} extraStyle="break-all" />
									</div>
									{/* <div className="text-sm font-bold">
										<ExplainerNotification
											title={
												<div className="flex flex-row space-x-2">
													<Network id={chainId} size={20} />
													<span className="text-sm">{chain?.name}</span>
												</div>
											}
											content={`Only send on the ${chain?.name} network otherwise funds will be lost`}
											disclaimer
										/>
									</div> */}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</StepLayout>
	);
};

export default FundEscrow;
// function setUser(user: User): void {
// }

