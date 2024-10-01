export const talkJsAppId = (typeof process.env.NEXT_PUBLIC_TALKJS_APP_ID!=="string")?(process.env.NEXT_PUBLIC_TALKJS_APP_ID+''):process.env.NEXT_PUBLIC_TALKJS_APP_ID;
export const intercomAppId = (typeof process.env.NEXT_PUBLIC_INTERCOM_APP_ID!=="string")?(process.env.NEXT_PUBLIC_INTERCOM_APP_ID+''):process.env.NEXT_PUBLIC_INTERCOM_APP_ID;
export const arbitrator = process.env.NEXT_PUBLIC_ARBITRATOR_ADDRESS;
export const feeRecepient = process.env.NEXT_PUBLIC_FEE_RECEPIENT;
export const feePayer = process.env.NEXT_PUBLIC_FEE_RECEPIENT;