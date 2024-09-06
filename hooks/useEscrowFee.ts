import { Connection, PublicKey } from '@solana/web3.js';
import { Token } from 'models/types';

interface UseEscrowFeeParams {
    address?: string;
    token: Token | undefined;
    tokenAmount: number | undefined;
}

const useEscrowFee = ({ address, tokenAmount, token }: UseEscrowFeeParams) => {
    if (!address || !token || !tokenAmount) return { isFetching: false, fee: null, partnerFeeBps: null, totalAmount: null };

    const connection = new Connection('https://api.mainnet-beta.solana.com');
    const contract = new PublicKey(address);
    const partner = PublicKey.default.toString();

    const fetchFeeData = async () => {
        const feeAccountInfo = await connection.getAccountInfo(contract);
        if (!feeAccountInfo) return { isFetching: false, fee: null, partnerFeeBps: null, totalAmount: null };

        const feeData = feeAccountInfo.data;
        const feeBps = feeData.readBigInt64LE(0); // Example: read fee basis points from data
        const openPeerFeeBps = feeData.readBigInt64LE(8); // Example: read open peer fee basis points from data

        const rawTokenAmount = BigInt(tokenAmount) * BigInt(10 ** token.decimals);
        const fee = (rawTokenAmount * feeBps) / BigInt(10000);
        const totalAmount = rawTokenAmount + fee;

        return { isFetching: false, fee, partnerFeeBps: feeBps - openPeerFeeBps, totalAmount };
    };

    return  fetchFeeData;
};

export default useEscrowFee;
