import Button from 'components/Button/Button';
import CancelOrderButton from 'components/Buy/CancelOrderButton/CancelOrderButton';
import OpenDisputeButton from 'components/Buy/OpenDisputeButton';
import ReleaseFundsButton from 'components/Buy/ReleaseFundsButton';
import Input from 'components/Input/Input';
import Label from 'components/Label/Label';
import Textarea from 'components/Textarea/Textarea';
import { useFormErrors, useAccount } from 'hooks';
import { Errors } from 'models/errors';
import { Order } from 'models/types';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import snakecaseKeys from 'snakecase-keys';
import { useRouter } from 'next/router';

import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import FilesUploader from './FilesUploader';

interface Upload {
	key: string;
	signedURL: string;
	filename: string;
}

interface DisputeFormParams {
	order: Order;
	address: string;
	paidForDispute: boolean;
	fee: string;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];


const DisputeForm = ({ order, address, paidForDispute, fee }: DisputeFormParams) => {
	const router=useRouter();
	const { id:orderId,uuid, dispute, buyer } = order;
	// @ts-ignore
	const { user_dispute: userDispute, resolved } = dispute[0] || {};

	const { comments: userComment, dispute_files: files = [] } = userDispute || {};
	const { address: connectedAddress } = useAccount();
	const isBuyer = buyer.address === connectedAddress;

	const [comments, setComments] = useState(userComment || '');
	const [ crossList, setCrossList ] = useState<string[]>([]);

	// @ts-ignore
	const orderUploads: Upload[] = files.map((file) => ({
		signedURL: file.upload_url,
		key: file.key,
		filename: file.filename
	}));

	const [uploads, setUploads] = useState<Upload[]>(orderUploads);
	const { errors, clearErrors, validate } = useFormErrors();

	const onUploadFinished = (newUploads: Upload[]) => {
		setUploads([...newUploads, ...uploads]);
	};

	const onChangeComments = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
		clearErrors(['comments']);
		setComments(event.target.value);
	};

	const resolver = () => {
		const error: Errors = {};
		if (!comments) {
			error.comments = 'Should be present';
		}

		// include not before paidForDispute
		if (uploads.length === 0) {
			error.uploads = 'Add some evidence';
		}

		return error;
	};

	const onContinue = async (statusUpdated:boolean=false) => {
		console.log("[DisputeForm] Starting form submission:", {
			hasValidation: validate(resolver),
			paidForDispute,
			statusUpdated,
			uploads: uploads.length,
			comments: !!comments
		});

		if (validate(resolver) && (paidForDispute||statusUpdated)) {
			console.log("[DisputeForm] Validation passed, submitting dispute");

			try {
				const payload = snakecaseKeys(
					{
						comments,
						winner_id: null,
						resolved: false,
						files: uploads.map(({ key }) => key.replace(`disputes/${order.id}/`,''))
					},
					{ deep: true }
				);

				console.log("[DisputeForm] Sending dispute data:", {
					orderId: order.id,
					payload
				});

				const result = await fetch(`/api/orders/${order.id}/disputes`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${getAuthToken()}`
					},
					body: JSON.stringify(payload)
				});

				const response = await result.json();
				console.log("[DisputeForm] Dispute submission response:", response);

				router.reload();
			} catch (error) {
				console.error("[DisputeForm] Error submitting dispute:", error);
			}
		} else {
			console.log("[DisputeForm] Form validation failed:", {
				errors: resolver(),
				paidForDispute,
				statusUpdated
			});
		}
	};

	const removeFile = async(keyToRemove:string,filename:string)=>{
		setCrossList((prev) => {
			const newArr = [...prev, keyToRemove]; // Adding a new item
			return newArr;
		  });
		const formData = new FormData();
		formData.append('filename', filename);
		formData.append('orderId', orderId.toString());
		formData.append('case', '1');
	
		if(connectedAddress) formData.append('address',connectedAddress.toString());

		fetch('/api/s3/removedispute', {
			method: 'POST',
			body: formData,
			headers: {
				Accept: ALLOWED_FILE_TYPES.join(', ')
			}
		})
		.then((res) => res.json())
		.then(({ data }) => {
			if (data.error) {
				// setError(data.error);
			}else{
				setUploads((prev:Upload[])=>{
					const newState = prev.filter((upload) => upload.key !== keyToRemove);
  					return newState;
				});
			}
		});
	}

	useEffect(()=>{
		if(!!userDispute === false){
			const formData = new FormData();
			formData.append('orderId', orderId.toString());
			formData.append('case', '2');
			if(connectedAddress) formData.append('address',connectedAddress.toString());
			fetch('/api/s3/removedispute', {
				method: 'POST',
				body: formData,
				// headers: {
				// 	Accept: ALLOWED_FILE_TYPES.join(', ')
				// }
			})
		}
	},[userDispute]);

	return (
		<>
			<div>
				<Label title="Comments" />
				<Textarea
					rows={4}
					id="comments"
					value={comments}
					placeholder="Tell us more about the transaction"
					onChange={onChangeComments}
					error={errors.comments}
				/>
			</div>
			<div>
				<Label title="Upload proof" />
				{uploads.length < 5 && (
					<div className="mb-8">
						<FilesUploader orderId={orderId} uuid={uuid} address={address} onUploadFinished={onUploadFinished} />
						{!!errors.uploads && <p className="mt-2 text-sm text-red-600">{errors.uploads}</p>}
					</div>
				)}
				{uploads.length > 0 && (
					<div className="w-full flex flex-col md:flex-row space-x-2">
						{uploads.map(({ key, signedURL, filename },index) => {
							const checkCrossList = crossList.includes(key);
							const fileType = key.split('.').pop()?.toLowerCase();

							if(checkCrossList) return <></>

							return (
								<div key={key} className="w-full md:w-1/3 mb-4 items-center justify-center relative">
									<div className="bg-gray-200 flex w-full h-full items-center justify-center rounded">
										{fileType === 'pdf' ? (
											<div className="flex flex-col items-center relative">
												<DocumentIcon className="text-puple-900 w-10" />
												<p className="text-xs text-gray-600 break-all p-2">{filename}</p>
											</div>
										) : ['jpg', 'jpeg', 'png', 'gif'].includes(fileType!) ? (
											<Image
												key={key}
												unoptimized
												priority
												src={signedURL}
												alt={`Uploaded file ${key}`}
												width={143}
												height={136}
												className="rounded-md"
											/>
										) : (
											<p key={key}>Unsupported file type</p>
										)}
										<button
											type="button"
											className="absolute -top-2 -right-2 h-4 w-4 rounded-full bg-purple-600 ring-2 ring-white flex items-center justify-center cursor-pointer"
											onClick={()=>removeFile(key,filename)}
										>
											<XMarkIcon className="w-8 h-8 text-white" />
										</button>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
			{!paidForDispute && (
				<div>
					<Input label="Pay" disabled id="pay" value={fee} />
				</div>
			)}
			<div className="flex flex-col md:flex-row gap-x-8 items-center">
				{!resolved &&
					(isBuyer ? (
						<CancelOrderButton order={order} title="Cancel" />
					) : (
						<ReleaseFundsButton order={order} outlined title="Cancel" dispute />
					))}
				{paidForDispute ? (
					<Button title="Continue" onClick={()=>onContinue()} />
				) : (
						<OpenDisputeButton order={order} outlined={false} title="Open Dispute" disabledProp={Object.keys(resolver()).length?true:false} updateFormDetails={true} onContinue={onContinue}/>
				)}
			</div>
		</>
	);
};

export default DisputeForm;
