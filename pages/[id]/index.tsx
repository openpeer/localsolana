import {HeaderMetrics, Label, ListsTable, Loading } from 'components';
// import NotificationHeader from 'components/Notifications/NotificationHeader';
import { List, User } from 'models/types';
import { GetServerSideProps } from 'next';
import ErrorPage from 'next/error';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useAccount } from 'hooks';

const Profile = ({ id }: { id: number }) => {
	const [user, setUser] = useState<User | null>();
	const [lists, setLists] = useState<List[]>([]);
	const { address } = useAccount();
	const router = useRouter();
	const { verification } = router.query;

	useEffect(() => {
		fetch(`/api/user_profiles/${id}`)
			.then((res) => res.json())
			.then((data) => {
				if (data.errors) {
					setUser(null);
				} else {
					setUser(data.data);
				}
			});
	}, [id]);

	useEffect(() => {
		if (!user) return;
		fetch(`/api/lists?&seller=${user.address}`)
		// fetch(`/api/lists?&seller=0xFE6b7A4494B308f8c0025DCc635ac22630ec73301`)
			.then((res) => res.json())
			.then((data) => {
				setLists(data.data);
			});

		// setLists({
		// 	"data": [
		// 		{
		// 			"id": 3600,
		// 			"automatic_approval": true,
		// 			"chain_id": 1,
		// 			"limit_min": null,
		// 			"limit_max": null,
		// 			"margin_type": "fixed",
		// 			"margin": "0.87",
		// 			"status": "active",
		// 			"terms": null,
		// 			"total_available_amount": "100.0",
		// 			"price": "0.87",
		// 			"type": "BuyList",
		// 			"deposit_time_limit": 60,
		// 			"payment_time_limit": 1440,
		// 			"accept_only_verified": false,
		// 			"escrow_type": "manual",
		// 			"contract": null,
		// 			"price_source": "binance_median",
		// 			"seller": {
		// 				"id": 10903,
		// 				"address": "0xe0573c0f101C38334eC858812A05A882Ca8caAbd",
		// 				"unique_identifier": "54a92c64-d33b-41d0-bc96-85832997a3da",
		// 				"created_at": "2024-07-30T06:08:18.831Z",
		// 				"trades": 0,
		// 				"image_url": null,
		// 				"name": "Jaskaran",
		// 				"twitter": null,
		// 				"verified": false,
		// 				"completion_rate": null,
		// 				"timezone": null,
		// 				"available_from": null,
		// 				"available_to": null,
		// 				"weekend_offline": false,
		// 				"online": null,
		// 				"telegram_user_id": null,
		// 				"telegram_username": null,
		// 				"whatsapp_country_code": null,
		// 				"whatsapp_number": null,
		// 				"email": "ja*****@gm*****",
		// 				"contracts": [
		// 					{
		// 						"id": 418,
		// 						"chain_id": 137,
		// 						"address": "0x78c189042116218fb5579500451975126f255e14",
		// 						"version": "4",
		// 						"locked_value": null
		// 					}
		// 				]
		// 			},
		// 			"token": {
		// 				"id": 20,
		// 				"address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
		// 				"chain_id": 1,
		// 				"decimals": 6,
		// 				"symbol": "USDT",
		// 				"name": "USDT",
		// 				"coingecko_id": "tether",
		// 				"coinmarketcap_id": "tether",
		// 				"gasless": false,
		// 				"icon": "https://cryptologos.cc/logos/thumbs/tether.png",
		// 				"minimum_amount": "10.0",
		// 				"allow_binance_rates": true
		// 			},
		// 			"fiat_currency": {
		// 				"id": 18,
		// 				"code": "EUR",
		// 				"name": "Euro",
		// 				"country_code": "EU",
		// 				"symbol": "€",
		// 				"allow_binance_rates": true,
		// 				"default_price_source": "binance_median",
		// 				"icon": "EU"
		// 			},
		// 			"payment_methods": [],
		// 			"banks": [
		// 				{
		// 					"id": 11,
		// 					"name": "N26",
		// 					"account_info_schema": [
		// 						{
		// 							"label": "Email or Phone",
		// 							"id": "n26_id",
		// 							"required": true
		// 						},
		// 						{
		// 							"label": "Details",
		// 							"id": "details",
		// 							"type": "textarea",
		// 							"required": false
		// 						}
		// 					],
		// 					"color": "#36a18b",
		// 					"icon": "https://openpeerbanksimages.s3.us-west-1.amazonaws.com/e50exy8p5tp7efrs38c0syr0s6j2?response-content-disposition=inline%3B%20filename%3D%22icon-bank-n26.png%22%3B%20filename%2A%3DUTF-8%27%27icon-bank-n26.png&response-content-type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5QGFLMBJXBZ3MUHI%2F20240905%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240905T065243Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=141d3a4dd7aa0712815e454d8ff9edb7bf73926f01ed36395a2cff506b8de4a5"
		// 				},
		// 				{
		// 					"id": 14,
		// 					"name": "MB Way Portugal",
		// 					"account_info_schema": [
		// 						{
		// 							"label": "Phone Number",
		// 							"id": "phone_number",
		// 							"required": true
		// 						},
		// 						{
		// 							"label": "Details",
		// 							"id": "details",
		// 							"type": "textarea",
		// 							"required": false
		// 						}
		// 					],
		// 					"color": "#d60510",
		// 					"icon": "https://openpeerbanksimages.s3.us-west-1.amazonaws.com/l4ghh1di6ynhygybeq2dmyru68n5?response-content-disposition=inline%3B%20filename%3D%22icon-bank-mbway.png%22%3B%20filename%2A%3DUTF-8%27%27icon-bank-mbway.png&response-content-type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIA5QGFLMBJXBZ3MUHI%2F20240905%2Fus-west-1%2Fs3%2Faws4_request&X-Amz-Date=20240905T065243Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=a8c33949180284de44cd700115f774271eb52b67d5071f0d99623ff8514fd219"
		// 				}
		// 			]
		// 		}
		// 	],
		// 	"meta": {
		// 		"current_page": 1,
		// 		"total_pages": 1,
		// 		"total_count": 1
		// 	}
		// });
	}, [user]);

	if (user === undefined) {
		return <Loading />;
	}
	if (user === null) {
		return <ErrorPage statusCode={404} />;
	}

	const isLoggedUser = address === user.address;
	const hasEmail = !!user.email;	
	// lists.filter((l)=>{console.log(l)});
	
	const buyLists  = lists?lists.filter((l) => l.type === 'BuyList'):[];
	const sellLists = lists?lists.filter((l) => l.type === 'SellList'):[];
	// console.log(buyLists,lists);
	
	
// 	const filteredData = lists["data"].filter(item => item.status === 'active' && item.escrow_type === 'manual');

	return (
		<>
			{/* {isLoggedUser && !hasEmail && (
				<NotificationHeader
					type="error"
					message="Update your email address to receive the sales notifications"
					detailsLink={`/${user.address}/edit`}
				/>
			)} */}

			<HeaderMetrics user={user} verificationOpen={!!verification} />
			{(buyLists.length +sellLists.length) > 0 && (
				<div className="flex px-6">
					<div className="w-full md:w-5/6 m-auto">
						{sellLists.length > 0 && (
							<div className="mb-4">
								<Label title="Buy Ads" />
								<ListsTable
									lists={lists.filter((l) => l.type === 'SellList')}
									hideLowAmounts={!isLoggedUser}
								/>
							</div>
						)}
						{buyLists.length > 0 && (
							<div>
								
								<Label title="Sell Ads" />
								<ListsTable
									lists={lists.filter((l) => l.type === 'BuyList')}
									hideLowAmounts={!isLoggedUser}
								/>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export const getServerSideProps: GetServerSideProps<{ id: string }> = async (context) => ({
	props: { title: 'Profile', id: String(context.params?.id), disableAuthentication: false } // will be passed to the page component as props
});

export default Profile;
