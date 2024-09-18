import { useTransactionFeedbackModal } from 'contexts/TransactionFeedContext';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

interface Params {
	isSuccess: boolean;
	hash: string | undefined;
	Link: JSX.Element;
	description: string;
}

const useTransactionFeedback = ({ isSuccess, hash, Link, description }: Params) => {
	//const { chain } = 'solana';

	const { addRecentTransaction } = useTransactionFeedbackModal();

	useEffect(() => {
		if (hash) {
			addRecentTransaction({
				hash,
				description
			});
			if (isSuccess) {
				toast.success(Link, {
					theme: 'dark',
					position: 'top-right',
					autoClose: 10000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: false,
					progress: undefined
				});
			}
		}
	}, [isSuccess, hash,]);
};

export default useTransactionFeedback;
