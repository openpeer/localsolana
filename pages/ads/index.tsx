import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { AdjustmentsHorizontalIcon, PlusIcon } from '@heroicons/react/24/solid';
import { Button, Label, ListsTable, Loading } from 'components';
import IconButton from 'components/Button/IconButton';
import { List } from 'models/types';
import { GetServerSideProps } from 'next';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAccount } from 'hooks';
import Link from 'next/link';

const Ads = () => {
	const [lists, setLists] = useState<List[]>();
	const { address } = useAccount();
	const router = useRouter();

	useEffect(() => {
		if (!address) return;
		// fetch('/api/lists/ads', {
		fetch(`/api/lists?&seller=${address}`, {
			headers: {
				Authorization: `Bearer ${getAuthToken()}`
			}
		})
			.then((res) => res.json())
			.then((data) => {
				setLists(data.data);
				// change here
				// setLists([
				// 	{
				// 		"id": 3600,
				// 		"automatic_approval": true,
				// 		"chain_id": 1,
				// 		"limit_min": null,
				// 		"limit_max": null,
				// 		"margin_type": "fixed",
				// 		"margin": "0.87",
				// 		"status": "active",
				// 		"terms": null,
				// 		"total_available_amount": "100.0",
				// 		"price": "0.87",
				// 		"type": "BuyList",
				// 		"deposit_time_limit": 60,
				// 		"payment_time_limit": 1440,
				// 		"accept_only_verified": false,
				// 		"escrow_type": "manual",
				// 		"contract": null,
				// 		"price_source": "binance_median",
				// 		"seller": {
				// 			"id": 10903,
				// 			"address": "0xe0573c0f101C38334eC858812A05A882Ca8caAbd",
				// 			"unique_identifier": "54a92c64-d33b-41d0-bc96-85832997a3da",
				// 			"created_at": "2024-07-30T06:08:18.831Z",
				// 			"trades": 0,
				// 			"image_url": null,
				// 			"name": "Jaskaran",
				// 			"twitter": null,
				// 			"verified": false,
				// 			"completion_rate": null,
				// 			"timezone": null,
				// 			"available_from": null,
				// 			"available_to": null,
				// 			"weekend_offline": false,
				// 			"online": null,
				// 			"telegram_user_id": null,
				// 			"telegram_username": null,
				// 			"whatsapp_country_code": null,
				// 			"whatsapp_number": null,
				// 			"email": "ja*****@gm*****",
				// 			"contracts": [
				// 				{
				// 					"id": 418,
				// 					"chain_id": 137,
				// 					"address": "0x78c189042116218fb5579500451975126f255e14",
				// 					"version": "4",
				// 					"locked_value": null
				// 				}
				// 			]
				// 		},
				// 		"token": {
				// 			"id": 20,
				// 			"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
				// 			"chain_id": 1,
				// 			"decimals": 6,
				// 			"symbol": "USDT",
				// 			"name": "USDT",
				// 			"coingecko_id": "tether",
				// 			"coinmarketcap_id": "tether",
				// 			"gasless": false,
				// 			"icon": "https://cryptologos.cc/logos/thumbs/tether.png",
				// 			"minimum_amount": "10.0",
				// 			"allow_binance_rates": true
				// 		},
				// 		"fiat_currency": {
				// 			"id": 18,
				// 			"code": "EUR",
				// 			"name": "Euro",
				// 			"country_code": "EU",
				// 			"symbol": "€",
				// 			"allow_binance_rates": true,
				// 			"default_price_source": "binance_median",
				// 			"icon": "EU"
				// 		},
				// 		"payment_methods": [],
				// 		"banks": [
				// 			{
				// 				"id": 11,
				// 				"name": "N26",
				// 				"account_info_schema": [
				// 					{
				// 						"label": "Email or Phone",
				// 						"id": "n26_id",
				// 						"required": true
				// 					},
				// 					{
				// 						"label": "Details",
				// 						"id": "details",
				// 						"type": "textarea",
				// 						"required": false
				// 					}
				// 				],
				// 				"color": "#36a18b",
				// 				"icon": "https://openpeerbanksimages.s3.us-west-1.amazonaws.com/e50exy8p5tp7efrs38c0syr0s6j2?response-content-disposition=inline%3B%20filename%3D%22icon-bank-n26.png%22%3B%20filename%2A%3DUTF-8%27%27icon-bank-n26.png&response-content-type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5QGFLMBJXBZ3MUHI%2F20240906%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240906T103008Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=4867cf73c0c3c59c851700bab088d8e886671615c748a96a3fcf910465e4df9a"
				// 			},
				// 			{
				// 				"id": 14,
				// 				"name": "MB Way Portugal",
				// 				"account_info_schema": [
				// 					{
				// 						"label": "Phone Number",
				// 						"id": "phone_number",
				// 						"required": true
				// 					},
				// 					{
				// 						"label": "Details",
				// 						"id": "details",
				// 						"type": "textarea",
				// 						"required": false
				// 					}
				// 				],
				// 				"color": "#d60510",
				// 				"icon": "https://openpeerbanksimages.s3.us-west-1.amazonaws.com/l4ghh1di6ynhygybeq2dmyru68n5?response-content-disposition=inline%3B%20filename%3D%22icon-bank-mbway.png%22%3B%20filename%2A%3DUTF-8%27%27icon-bank-mbway.png&response-content-type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5QGFLMBJXBZ3MUHI%2F20240906%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240906T103008Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=c628ad1d336fc708195d456112fedd7dd58cb5bfb723410c0ffcd514a2e1908b"
				// 			}
				// 		]
				// 	},
				// 	{
				// 		"id": 3640,
				// 		"automatic_approval": true,
				// 		"chain_id": 1,
				// 		"limit_min": null,
				// 		"limit_max": null,
				// 		"margin_type": "fixed",
				// 		"margin": "0.843",
				// 		"status": "active",
				// 		"terms": "<p>This is test</p>",
				// 		"total_available_amount": "100.0",
				// 		"price": "0.843",
				// 		"type": "BuyList",
				// 		"deposit_time_limit": 60,
				// 		"payment_time_limit": 1440,
				// 		"accept_only_verified": false,
				// 		"escrow_type": "manual",
				// 		"contract": null,
				// 		"price_source": "binance_median",
				// 		"seller": {
				// 			"id": 10903,
				// 			"address": "0xe0573c0f101C38334eC858812A05A882Ca8caAbd",
				// 			"unique_identifier": "54a92c64-d33b-41d0-bc96-85832997a3da",
				// 			"created_at": "2024-07-30T06:08:18.831Z",
				// 			"trades": 0,
				// 			"image_url": null,
				// 			"name": "Jaskaran",
				// 			"twitter": null,
				// 			"verified": false,
				// 			"completion_rate": null,
				// 			"timezone": null,
				// 			"available_from": null,
				// 			"available_to": null,
				// 			"weekend_offline": false,
				// 			"online": null,
				// 			"telegram_user_id": null,
				// 			"telegram_username": null,
				// 			"whatsapp_country_code": null,
				// 			"whatsapp_number": null,
				// 			"email": "ja*****@gm*****",
				// 			"contracts": [
				// 				{
				// 					"id": 418,
				// 					"chain_id": 137,
				// 					"address": "0x78c189042116218fb5579500451975126f255e14",
				// 					"version": "4",
				// 					"locked_value": null
				// 				}
				// 			]
				// 		},
				// 		"token": {
				// 			"id": 20,
				// 			"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
				// 			"chain_id": 1,
				// 			"decimals": 6,
				// 			"symbol": "USDT",
				// 			"name": "USDT",
				// 			"coingecko_id": "tether",
				// 			"coinmarketcap_id": "tether",
				// 			"gasless": false,
				// 			"icon": "https://cryptologos.cc/logos/thumbs/tether.png",
				// 			"minimum_amount": "10.0",
				// 			"allow_binance_rates": true
				// 		},
				// 		"fiat_currency": {
				// 			"id": 18,
				// 			"code": "EUR",
				// 			"name": "Euro",
				// 			"country_code": "EU",
				// 			"symbol": "€",
				// 			"allow_binance_rates": true,
				// 			"default_price_source": "binance_median",
				// 			"icon": "EU"
				// 		},
				// 		"payment_methods": [],
				// 		"banks": [
				// 			{
				// 				"id": 11,
				// 				"name": "N26",
				// 				"account_info_schema": [
				// 					{
				// 						"label": "Email or Phone",
				// 						"id": "n26_id",
				// 						"required": true
				// 					},
				// 					{
				// 						"label": "Details",
				// 						"id": "details",
				// 						"type": "textarea",
				// 						"required": false
				// 					}
				// 				],
				// 				"color": "#36a18b",
				// 				"icon": "https://openpeerbanksimages.s3.us-west-1.amazonaws.com/e50exy8p5tp7efrs38c0syr0s6j2?response-content-disposition=inline%3B%20filename%3D%22icon-bank-n26.png%22%3B%20filename%2A%3DUTF-8%27%27icon-bank-n26.png&response-content-type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5QGFLMBJXBZ3MUHI%2F20240906%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240906T103008Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=4867cf73c0c3c59c851700bab088d8e886671615c748a96a3fcf910465e4df9a"
				// 			}
				// 		]
				// 	}
				// ]);
			});
	}, [address]);

	if (lists === undefined) {
		return <Loading />;
	}

	const settingsPath = () => {
		router.push('/ads/settings');
	};

	const createAddPath = () => {
		router.push('/sell');
	};

	const sellLists = lists.filter((l) => l.type === 'SellList');
	const buyLists = lists.filter((l) => l.type === 'BuyList');

	return (
		<div className="py-6">
			<div className="flex flex-col mx-auto px-4 sm:px-6 md:px-8">
				<div className="flex flex-row justify-end mb-4 space-x-4">
					<IconButton
						outlined
						title="Settings"
						icon={<AdjustmentsHorizontalIcon width="20" height="20" />}
						onClick={settingsPath}
					/>
					<IconButton
						title="Create New Ad"
						icon={<PlusIcon width="20" height="20" />}
						onClick={createAddPath}
					/>
				</div>
				{lists.length > 0 ? (
					<>
						{sellLists.length > 0 && (
							<div className="mb-4">
								<Label title="Buy Ads" />
								<ListsTable lists={lists.filter((l) => l.type === 'SellList')} />
							</div>
						)}
						{buyLists.length > 0 && (
							<div>
								<Label title="Sell Ads" />
								<ListsTable lists={lists.filter((l) => l.type === 'BuyList')} />
							</div>
						)}
					</>
				) : (
					<Loading
						spinner={false}
						message={
							<Link className="flex flex-col items-center space-y-2" href="/sell">
								<div>You do not have any ads yet</div>
								<div>
									<Button title="Create an Ad" />
								</div>
							</Link>
						}
					/>
				)}
			</div>
		</div>
	);
};

export const getServerSideProps: GetServerSideProps = async () => ({
	props: { title: 'My Ads' }
});

export default Ads;
