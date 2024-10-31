/* eslint-disable no-mixed-spaces-and-tabs */
import StepLayout from 'components/Listing/StepLayout';
import React from 'react';
import { smallWalletAddress } from 'utils';
import { useAccount } from 'hooks';
import { BuyStepProps } from '../Buy/Buy.types';
import DisputeResume from './DisputeResume';
import HeaderH2 from 'components/SectionHeading/h2';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';


const DisputeCompleted = ({ order }: BuyStepProps) => {
	const { buyer, seller, dispute } = order;
	const { address } = useAccount();
	
	// @ts-ignore
	const {winner, resolved}=dispute?.[0]||{};

	return (
		<>
			<StepLayout>
                <span className="flex flex-row text-green-600 mb-2">
                    <CheckBadgeIcon className="w-8 mr-2" />
                    <HeaderH2 title="Dispute Resolved" />
                </span>
				<div className="my-8">
                    
					<div className="mb-4">
						<p className="text-base">
							{
								resolved && 
								address===process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS && 
								(									
									`You declared ${((+winner)===(+buyer?.id))?
										buyer?.name ?? smallWalletAddress(buyer.address)
										:
										seller?.name ?? smallWalletAddress(seller.address)
									} as winner.`
								)
							}
						</p>
					</div>

					<DisputeResume order={order} showRating />
				</div>
			</StepLayout>
		</>
	);
};

export default DisputeCompleted;
