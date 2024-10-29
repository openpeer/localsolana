/* eslint-disable no-mixed-spaces-and-tabs */
import StepLayout from 'components/Listing/StepLayout';
import HeaderH2 from 'components/SectionHeading/h2';
import React from 'react';
import { smallWalletAddress } from 'utils';
import { useAccount } from 'hooks';

import { CheckBadgeIcon } from '@heroicons/react/24/outline';

import { BuyStepProps } from './Buy.types';
import OrderResume from './OrderResume';

const Completed = ({ order }: BuyStepProps) => {
	const { list, token_amount: tokenAmount, buyer, seller, dispute } = order;
	const { token } = list!;
	const { address } = useAccount();
	const selling = seller.address === address;
	// @ts-ignore
	const {winner, resolved}=dispute?.[0]||{};
	const tokenValue = `${tokenAmount} ${token.symbol}`;

	// console.log(resolved, winner, buyer.id, ((+winner)===(+buyer?.id)), address,buyer.address, (address===buyer.address));

	return (
		<>
			<StepLayout>
				<div className="my-8">
					<div className="mb-4">
						<span className="flex flex-row text-green-600 mb-2">
							<CheckBadgeIcon className="w-8 mr-2" />
							<HeaderH2 title="Purchase Complete" />
						</span>
						<p className="text-base">
							{/* Case when dispute is raised and resolved */}
							{
								resolved && 
								address===process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS && 
								(									
									`LocalSolana Arbitrator declare chose ${((+winner)===(+buyer?.id))?
										buyer?.name ?? smallWalletAddress(buyer.address)
										:
										seller?.name ?? smallWalletAddress(seller.address)
									} as winner.`
								)
							}

							{/* Case when dispute is raised and resolved */}
							{
								resolved && 
								address===buyer.address && 
								(									
									`LocalSolana Arbitrator declare chose ${((+winner)===(+buyer?.id))?
										'You'
										:
										seller?.name ?? smallWalletAddress(seller.address)
									} as winner.`
								)
							}

							{/* Case when dispute is raised and resolved */}
							{
								resolved && 
								address===seller.address && 
								(									
									`LocalSolana Arbitrator declare chose ${((+winner)===(+seller?.id))?
										'You'
										:
										buyer?.name ?? smallWalletAddress(buyer.address)
									} as winner.`
								)
							}

							{/* Case when there is no dispute */}
							{!resolved &&
								(
								selling
									? `You have successfully sold ${tokenValue} to ${
											buyer?.name || smallWalletAddress(buyer?.address)
									}.`
									: `You have successfully purchased ${tokenValue} from ${
											seller?.name || smallWalletAddress(seller.address)
									}.`
								) 
							}
						</p>
					</div>

					<OrderResume order={order} showRating />
				</div>
			</StepLayout>
		</>
	);
};

export default Completed;
