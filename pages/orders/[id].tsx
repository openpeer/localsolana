import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Loading, Steps } from 'components';
import { Cancelled, Chat, Completed, Payment, Release, Summary } from 'components/Buy';
import { UIOrder } from 'components/Buy/Buy.types';
import Dispute from 'components/Dispute/Dispute';
import { GetServerSideProps } from 'next';
import { useAccount } from 'hooks';
import React, { useEffect, useState } from 'react';
//import { useNetwork } from 'wagmi';

const ERROR_STEP = 0;
const PAYMENT_METHOD_STEP = 2;
const RELEASE_STEP = 3;
const COMPLETED_STEP = 4;
const CANCELLED_STEP = 5;

const steps: { [key: string]: number } = {
	created: PAYMENT_METHOD_STEP,
	escrowed: PAYMENT_METHOD_STEP,
	release: RELEASE_STEP,
	cancelled: CANCELLED_STEP,
	closed: COMPLETED_STEP,
	dispute: COMPLETED_STEP,
	error: ERROR_STEP
};

const OrderPage = ({ id }: { id: `0x${string}` }) => {
	const [order, setOrder] = useState<UIOrder>();
	//const { chain } = useNetwork();
	const token = getAuthToken();
	const { address } = useAccount();

	useEffect(() => {
		// fetch(`/api/orders/${id}`, {
		// 	headers: {
		// 		Authorization: `Bearer ${token}`
		// 	}
		// })
		// 	.then((res) => res.json())
		// 	.then((data) => {
		// 		setOrder({ ...data, ...{ step: steps[data.status || 'error'] } });
		// 	});

		// changehere
		setOrder({
			"id": 4124,
			"fiat_amount": "93.9",
			"status": "created",
			"token_amount": "1.0",
			"price": "93.9",
			"uuid": "0x3964303334313965366335653431616530643863343462646132373733620000",
			"cancelled_at": null,
			"created_at": "2024-09-17T10:33:57.424Z",
			"trade_id": "0x33989db24286361553db0f81c33f0d2b08710b81efa9562ad08770fdec8d37b0",
			"deposit_time_limit": 60,
			"payment_time_limit": 1440,
			"chain_id": 1,
			"seller": {
				"id": 11153,
				"address": "0x733F8ab28c5C7C4c6EfBd797afbce79BCE9AAF4D",
				"unique_identifier": "c3c5a51c-2657-43ae-acf7-d26e7f115b4a",
				"created_at": "2024-09-04T12:33:38.122Z",
				"trades": 0,
				"image_url": null,
				"name": "garjpreetsingh2",
				"twitter": null,
				"verified": false,
				"completion_rate": 0,
				"timezone": null,
				"available_from": null,
				"available_to": null,
				"weekend_offline": false,
				"online": null,
				"telegram_user_id": null,
				"telegram_username": "",
				"whatsapp_country_code": null,
				"whatsapp_number": null,
				"email": "ra*****@gm*****",
				"contracts": []
			},
			"buyer": {
				"id": 10903,
				"address": "4uXATaUbYJjvRu1QfZVBDbhsa8XtDEvUUJWPKanHhsja",
				"unique_identifier": "54a92c64-d33b-41d0-bc96-85832997a3da",
				"created_at": "2024-07-30T06:08:18.831Z",
				"trades": 0,
				"image_url": null,
				"name": "Jaskaran",
				"twitter": null,
				"verified": false,
				"completion_rate": 0,
				"timezone": null,
				"available_from": null,
				"available_to": null,
				"weekend_offline": false,
				"online": null,
				"telegram_user_id": null,
				"telegram_username": null,
				"whatsapp_country_code": null,
				"whatsapp_number": null,
				"email": "ja*****@gm*****",
				"contracts": [
					{
						"id": 418,
						"chain_id": 137,
						"address": "0x78c189042116218fb5579500451975126f255e14",
						"version": "4",
						"locked_value": null
					}
				]
			},
			"list": {
				"id": 3684,
				"automatic_approval": true,
				"chain_id": 1,
				"limit_min": null,
				"limit_max": null,
				"margin_type": "fixed",
				"margin": "93.9",
				"status": "active",
				"terms": "<p>This is test. please do not buy</p>",
				"total_available_amount": "10.0",
				"price": 0,
				"type": "SellList",
				"deposit_time_limit": 60,
				"payment_time_limit": 1440,
				"accept_only_verified": false,
				"escrow_type": "manual",
				"contract": null,
				"price_source": "binance_median",
				"seller": {
					"id": 11153,
					"address": "0x733F8ab28c5C7C4c6EfBd797afbce79BCE9AAF4D",
					"unique_identifier": "c3c5a51c-2657-43ae-acf7-d26e7f115b4a",
					"created_at": "2024-09-04T12:33:38.122Z",
					"trades": 0,
					"image_url": null,
					"name": "garjpreetsingh2",
					"twitter": null,
					"verified": false,
					"completion_rate": 0,
					"timezone": null,
					"available_from": null,
					"available_to": null,
					"weekend_offline": false,
					"online": null,
					"telegram_user_id": null,
					"telegram_username": "",
					"whatsapp_country_code": null,
					"whatsapp_number": null,
					"email": "ra*****@gm*****",
					"contracts": []
				},
				"token": {
					"id": 20,
					"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
					"chain_id": 1,
					"decimals": 6,
					"symbol": "USDT",
					"name": "USDT",
					"coingecko_id": "tether",
					"coinmarketcap_id": "tether",
					"gasless": false,
					"icon": "https://cryptologos.cc/logos/thumbs/tether.png",
					"minimum_amount": "10.0",
					"allow_binance_rates": true
				},
				"fiat_currency": {
					"id": 11,
					"code": "INR",
					"name": "Indian Ruppee",
					"country_code": "IN",
					"symbol": "₹",
					"allow_binance_rates": true,
					"default_price_source": "binance_median",
					"icon": "IN"
				},
				"payment_methods": [
					{
						"id": 5382,
						"values": {
							"upi_id": "sdadasd",
							"details": "asdasdasdasd"
						},
						"bank": {
							"id": 6,
							"name": "UPI",
							"account_info_schema": [
								{
									"label": "UPI ID",
									"id": "upi_id",
									"required": true
								},
								{
									"label": "Details",
									"id": "details",
									"type": "textarea",
									"required": false
								}
							],
							"color": "#ff7909",
							"icon": "https://openpeerbanksimages.s3.us-west-1.amazonaws.com/jxi8hq224nkjr0br7jrah5kdnqj2?response-content-disposition=inline%3B%20filename%3D%22icon-bank-upi.png%22%3B%20filename%2A%3DUTF-8%27%27icon-bank-upi.png&response-content-type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5QGFLMBJXBZ3MUHI%2F20240917%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240917T103358Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=ed09cc1186e3aa518be1efc28925c6bba0ca37d0d8831ebf2a36f7a6025664cf"
						}
					},
					{
						"id": 5383,
						"values": {
							"name": "sadasdasd",
							"phone": "+919876543210"
						},
						"bank": {
							"id": 483,
							"name": "PhonePe",
							"account_info_schema": [
								{
									"label": "Full name",
									"id": "name",
									"required": true
								},
								{
									"label": "Phone number",
									"id": "phone",
									"required": true
								}
							],
							"color": "#5F259F",
							"icon": "https://openpeerbanksimages.s3.us-west-1.amazonaws.com/nbbeqpg12t9f7vwu50046pmjqh0x?response-content-disposition=inline%3B%20filename%3D%22469c6655-c8a0-4dc9-aca7-676f7b067840.png%22%3B%20filename%2A%3DUTF-8%27%27469c6655-c8a0-4dc9-aca7-676f7b067840.png&response-content-type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5QGFLMBJXBZ3MUHI%2F20240917%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240917T103358Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=241251762e49f7c79ef8c96d5579ad1dfa959e0d444880a7b8284c96a211c32f"
						}
					}
				],
				"banks": []
			},
			"payment_method": {
				"id": 5388,
				"values": {
					"upi_id": "sdadasd",
					"details": "asdasdasdasd"
				},
				"bank": {
					"id": 6,
					"name": "UPI",
					"account_info_schema": [
						{
							"label": "UPI ID",
							"id": "upi_id",
							"required": true
						},
						{
							"label": "Details",
							"id": "details",
							"type": "textarea",
							"required": false
						}
					],
					"color": "#ff7909",
					"icon": "https://openpeerbanksimages.s3.us-west-1.amazonaws.com/jxi8hq224nkjr0br7jrah5kdnqj2?response-content-disposition=inline%3B%20filename%3D%22icon-bank-upi.png%22%3B%20filename%2A%3DUTF-8%27%27icon-bank-upi.png&response-content-type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5QGFLMBJXBZ3MUHI%2F20240917%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240917T103358Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=ed09cc1186e3aa518be1efc28925c6bba0ca37d0d8831ebf2a36f7a6025664cf"
				}
			},
			"escrow": null,
			"dispute": null
		});
	}, [id, token]);

	useEffect(() => {
		const setupChannel = async () => {
			if (!token) return;
			const { createConsumer } = await import('@rails/actioncable');

			const consumer = createConsumer(`${process.env.NEXT_PUBLIC_API_WS_URL}/cable?token=${token}`);
			consumer.subscriptions.create(
				{
					channel: 'OrdersChannel',
					order_id: id
				},
				{
					received(response: string) {
						const { data: updatedOrder } = JSON.parse(response);
						console.log('updatedOrder', updatedOrder);
						setOrder({ ...updatedOrder, ...{ step: steps[updatedOrder.status] } });
					}
				}
			);
		};

		setupChannel();
	}, [token]);

	// if (order?.chain_id && chain && order.chain_id !== chain.id) {
	// 	return <WrongNetwork desiredChainId={order?.chain_id} />;
	// }

	if (!order?.id) return <Loading />;

	const { step=2, list, dispute } = order;
	console.log(order);

	if (!!dispute || order.status === 'dispute') {
		return <Dispute order={order} />;
	}

	const seller = order.seller || list.seller;
	const selling = seller.address === address;
	const chatAddress = selling ? order.buyer.address : seller.address;

	return (
		<div className="pt-4 md:pt-6">
			<div className="w-full flex flex-row px-4 sm:px-6 md:px-8 mb-16">
				<div className="w-full lg:w-2/4">
					<Steps currentStep={step} stepsCount={3} />
					{step === PAYMENT_METHOD_STEP && <Payment order={order} updateOrder={setOrder} />}
					{step === RELEASE_STEP && <Release order={order} updateOrder={setOrder} />}
					{step === COMPLETED_STEP && <Completed order={order} updateOrder={setOrder} />}
					{step === CANCELLED_STEP && <Cancelled order={order} updateOrder={setOrder} />}
					{/* {step === ERROR_STEP ? (
						<p>We could not find this order</p>
					) : (
						!!chatAddress && (
							<div className="md:hidden">
								<Chat address={chatAddress} label={selling ? 'buyer' : 'seller'} />
							</div>
						)
					)} */}
				</div>
				{!!list && <Summary order={order} />}
			</div>
		</div>
	);
};

export const getServerSideProps: GetServerSideProps<{ id: string }> = async ({ params }) => ({
	props: { title: 'Buy', id: String(params?.id) }
});
export default OrderPage;
