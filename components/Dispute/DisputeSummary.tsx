import React,{useState, useEffect} from 'react';
import { smallWalletAddress } from '@/utils';
import Image from 'next/image';
import Label from 'components/Label/Label';
import CancelOrderButton from 'components/Buy/CancelOrderButton/CancelOrderButton';
import ReleaseFundsButton from 'components/Buy/ReleaseFundsButton';
import { Order } from 'models/types';

interface DisputeViewForAdminParams {
	order: Order;
	address: string;
	userDisputeResponses: any;
}

const DisputeViewForAdmin=({ order, address, userDisputeResponses }: DisputeViewForAdminParams)=>{
	const {
		id,
		token_amount: tokenAmount,
		fiat_amount: fiatAmount,
		dispute,
		buyer,
		created_at: createdAt,
		seller,
		payment_method: { bank },
		list: { token, fiat_currency: currency }
	} = order;
	const { resolved, winner } = dispute!;
	// let resolved=false,winner=true;

	const isBuyer = address === buyer.address;
	const tokenValue = `${tokenAmount} ${token.symbol}`;
	const fiatValue = `${currency.symbol} ${Number(fiatAmount).toFixed(2)}`;
	const counterpart = isBuyer ? 'seller' : 'buyer';
	//const { fee } = useEscrowFee({ address: order?.escrow?.address, token, tokenAmount, chainId: token.chain_id });
	const date = new Date(createdAt);

	const seller_response = userDisputeResponses?.user_responses?.find((user:any)=>(+user.user_id)===(+seller.id));
	const buyer_response = userDisputeResponses?.user_responses?.find((user:any)=>(+user.user_id)===(+buyer.id));
	// console.log(userDisputeResponses,seller_response, buyer_response);
	return (
		<div>
			<div className="flex flex-col border-b pb-4">
				{!resolved ? (
					<div className="flex flex-row justify-between">
						<div className="font-bold">Dispute Details</div>
						<div className="text-cyan-600 hidden">
							Time left <span>15m:20secs</span>
						</div>
					</div>
				) 
				:
				// @ts-ignore 
				!!winner && winner === address ? (
					<div className="text-cyan-600">
						<div className="font-bold">Dispute Ended</div>
						You won the dispute. {tokenValue} and the fee has been credited to your account
					</div>
				) : (
					<div className="text-red-600">
						<div className="font-bold">Dispute Ended</div>
						Unfortunately, you lost the dispute. {tokenValue} has been credited back to the {counterpart}
						&apos;s account
					</div>
				)}
			</div>

			<div className='border-b mt-3'>
				<Label title="Seller Response" />
				<div className="text-sm mt-4">
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Seller</span>
						<span>{seller.name??smallWalletAddress(seller.address, 10)}</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Comments</span>
						<span>{seller_response?.comments}</span>
					</div>
					
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Images</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						{
							seller_response?.files.map((value:any)=>{
								return (
									<Image
										src={`${process.env.NEXT_PUBLIC_AWS_CLOUD_FRONT}/disputes/${order.id}/${value.filename}`}
										alt={"Dispute image"}
										className="flex-shrink-0 mr-1"
										width={200}
										height={200}
										unoptimized
									/>
								);
							})
						}
					</div>
				</div>
			</div>

			<div className='border-b mt-3'>
				<Label title="Buyer Response" />
				<div className="text-sm mt-4">
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Buyer</span>
						<span>{buyer?.name??smallWalletAddress(buyer.address, 10)}</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Comments</span>
						<span>{buyer_response?.comments}</span>
					</div>
					<div className="flex flex-row justify-between mb-2">
						<span className="text-gray-500">Images</span>
					</div>
					<div className="flex flex-row mb-2">
						{
							buyer_response?.files.map((value:any)=>{
								return (
									<Image
										src={`${process.env.NEXT_PUBLIC_AWS_CLOUD_FRONT}/disputes/${order.id}/${value.filename}`}
										alt={"Dispute image"}
										className="flex-shrink-0 mr-1"
										width={200}
										height={200}
										unoptimized
									/>
								);
							})
						}
					</div>				
					
				</div>
			</div>

			{/* {!resolved && (
				<div className="mt-8">
					{isBuyer ? (
						<CancelOrderButton order={order} title="Close Dispute" outlined={false} />
					) : (
						<ReleaseFundsButton order={order} title="Close Dispute" dispute />
					)}
				</div>
			)} */}
		</div>
	);
}


const DisputeSummary = ({ fee, address, order }: { fee: string, address:string, order:Order })=>{
	const [userDisputeResponses, setUserDisputeResponses] = useState({});
	useEffect(()=>{
		if(address===process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS){
			fetch(`/api/getParticularDispute/${order.id}`)
			.then((res)=>res.json())
			.then((res)=>{
				setUserDisputeResponses(res.data)
			});
		}
	},[]);
	
	if(address===process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS){	
		
		if(!Object.keys(userDisputeResponses).length) return <></>

		return (
		    <div className="w-full mt-16 md:mt-0 md:w-1/2 md:border-l-2 md:border-gray-200 md:pl-8">
                <DisputeViewForAdmin order={order} address={address} userDisputeResponses={userDisputeResponses}/>
            </div>
        );

	}

	return (
		<>
		</>
	)
};
export default DisputeSummary;
