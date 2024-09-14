import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { useConfirmationSignMessage, useAccount } from 'hooks';
import { useRouter } from 'next/router';
import React from 'react';
import snakecaseKeys from 'snakecase-keys';

import { Token } from 'models/types';
import Checkbox from 'components/Checkbox/Checkbox';
// import { useContractRead } from 'wagmi';
// import { DEPLOYER_CONTRACTS } from 'models/networks';
//import { constants } from 'ethers';
//import { listToMessage } from 'utils';
import dynamic from 'next/dynamic';
import Label from '../Label/Label';
import Selector from '../Selector';
import { ListStepProps } from './Listing.types';
import StepLayout from './StepLayout';
import FundEscrow from './FundEscrow';
import 'react-quill/dist/quill.snow.css';
import Button from '../Button/Button';

const QuillEditor = dynamic(() => import('react-quill'), { ssr: false });

const Details = ({ list, updateList }: ListStepProps) => {
	const { terms, depositTimeLimit, paymentTimeLimit, type, chainId, token, acceptOnlyVerified, escrowType } = list;
	const { address, isAuthenticated } = useAccount();
	const router = useRouter();

	const createList = async(data)=>{
		const escrowVal=escrowType==="manual"?0:1;
		// console.log(address,snakecaseKeys( { ...list, ...{ bankIds: (list.banks || []).map((b) => b.id) }, margin_type:0,seller_id:3,escrowType:escrowVal }));
		// return;
		if(isAuthenticated){
			// need to add data inside the body
			const result = await fetch(
				// list.id ? `/api/lists/${list.id}` : '/api/createList',
				list.id ? `/api/list_management/${list.id}` : '/api/createList',
				{
					method: list.id ? 'PUT' : 'POST',
					body: JSON.stringify(
						// snakecaseKeys(
						// 	{
						// 		list: { ...list, ...{ bankIds: (list.banks || []).map((b) => b.id) }, margin_type:0,seller_id:3,escrowType:escrowVal,automatic_approval:false },
						// 		data
						// 	},
						// 	{ deep: true }
						// )
						snakecaseKeys( 
							{ ...list,
							 ...{ bankIds: (list.banks || []).map((b) => b.id) }, 
							 marginType:list.marginType==="fixed"?0:1,
							 seller_id:10951,
							 escrowType:escrowVal 
							})
					),
					headers: {
						Authorization: `Bearer ${getAuthToken()}`,
						'Content-Type': 'application/json',
					}
				}
			);
			const apiResult = await result.json();
			if (apiResult!.data!.id) {
				router.push(`/${address}`);
			}
		}
	};

	const { signMessage } = useConfirmationSignMessage({
		onSuccess: async (data) => {
			const result = await fetch(
				list.id ? `/api/lists/${list.id}` : '/api/lists',

				{
					method: list.id ? 'PUT' : 'POST',
					body: JSON.stringify(
						snakecaseKeys(
							{
								list: { ...list, ...{ bankIds: (list.banks || []).map((b) => b.id) } },
								data
							},
							{ deep: true }
						)
					),
					headers: {
						Authorization: `Bearer ${getAuthToken()}`
					}
				}
			);
			const { id } = await result.json();

			if (id) {
				router.push(`/${address}`);
			}
		}
	});

	const onTermsChange = (value: string) => {
		updateList({ ...list, ...{ terms: value } });
	};

	// const { data: sellerContract } = useContractRead({
	// 	address: DEPLOYER_CONTRACTS[chainId],
	// 	abi: OpenPeerDeployer,
	// 	functionName: 'sellerContracts',
	// 	args: [address],
	// 	enabled: !!address && escrowType === 'instant',
	// 	chainId,
	// 	watch: true
	// });

	// const { data: balance } = useContractRead({
	// 	address: sellerContract as `0x${string}`,
	// 	abi: OpenPeerEscrow,
	// 	functionName: 'balances',
	// 	args: [(token as Token).address],
	// 	enabled: !!sellerContract && sellerContract !== constants.AddressZero,
	// 	chainId,
	// 	watch: true
	// });

	const needToDeploy = true;
	const needToFund = true;
	const balance = 0;
		
		// (balance as bigint) < parseUnits(String((list.totalAvailableAmount || 0) / 4), (token as Token)!.decimals);

	const needToDeployOrFund = escrowType === 'instant' && (needToDeploy || needToFund);

	const onProceed = () => {
		// if (!needToDeployOrFund) {
		// 	const message = listToMessage(list);
		// 	signMessage({ message });
		// }
	};

	if (needToDeployOrFund) {
		return (
			<>
				<Button title="Click Me" onClick={()=>createList('0x2ad3022365874e29e4220612c546499dedae4f9e826d6cb78aa0a7ed19f562903d87f0758a147c2aa43fac12c88ce07c2afa993ad68792c4026c5b64de50d3381c')}/>
				<FundEscrow
					token={token as Token}
					sellerContract="0xsadhsjhdjsahdjkaskdhkas"
					chainId={chainId}
					balance={(balance || BigInt(0)) as bigint}
					totalAvailableAmount={list.totalAvailableAmount!}
				/>
			</>
		);
	}

	return (
		<StepLayout
			onProceed={onProceed}
			buttonText={
				!needToDeployOrFund
					? 'Sign and Finish'
					: needToDeploy
					? 'Deploy Escrow Contract'
					: 'Deposit in the Escrow Contract'
			}
		>
			<div className="my-8">
				{list.escrowType === 'manual' && (
					<>
						<Label title="Deposit Time Limit" />
						<div className="mb-4">
							<span className="text-sm text-gray-600">
								{depositTimeLimit > 0 ? (
									<div>
										Your order will be cancelled if {type === 'SellList' ? 'you' : 'the seller'}{' '}
										dont deposit after {depositTimeLimit}{' '}
										{depositTimeLimit === 1 ? 'minute' : 'minutes'}.{' '}
										<strong>You can set this to 0 to disable this feature.</strong>
									</div>
								) : (
									<div>
										Your orders will not be cancelled automatically.{' '}
										<strong>You can set this to 0 to disable this feature.</strong>
									</div>
								)}
							</span>
						</div>
						<Selector
							value={depositTimeLimit}
							suffix={depositTimeLimit === 1 ? ' min' : ' mins'}
							changeableAmount={1}
							updateValue={(n) => updateList({ ...list, ...{ depositTimeLimit: n } })}
							decimals={0}
						/>
					</>
				)}

				<Label title="Payment Time Limit" />
				<div className="mb-4">
					<span className="text-sm text-gray-600">
						{paymentTimeLimit > 0 ? (
							<div>
								Your order can be cancelled if {type === 'SellList' ? 'the buyer' : 'you'} dont pay
								after {paymentTimeLimit} {paymentTimeLimit === 1 ? 'minute' : 'minutes'}.{' '}
								<strong>Minimum 15 minutes. Maximum 24 hours.</strong>
							</div>
						) : (
							<div>Your orders will not be cancelled automatically. </div>
						)}
					</span>
				</div>
				<Selector
					value={paymentTimeLimit}
					suffix={paymentTimeLimit === 1 ? ' min' : ' mins'}
					changeableAmount={1}
					updateValue={(n) => updateList({ ...list, ...{ paymentTimeLimit: n } })}
					decimals={0}
					minValue={15}
					maxValue={24 * 60}
				/>

				<div className="mb-4">
					<Checkbox
						content={`Accept only verified ${type === 'SellList' ? 'buyers' : 'sellers'}`}
						id="verified"
						name="verified"
						checked={acceptOnlyVerified}
						onChange={() => updateList({ ...list, ...{ acceptOnlyVerified: !acceptOnlyVerified } })}
					/>
				</div>
				<Label title="Order Terms" />
				<QuillEditor
					value={terms}
					onChange={onTermsChange}
					placeholder="Write the terms and conditions for your listing here"
				/>
			</div>
		</StepLayout>
	);
};

export default Details;
