import { useTransactionFeedbackModal } from 'contexts/TransactionFeedContext';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

interface Params {
	isSuccess: boolean;
	hash: string | undefined;
	Link: JSX.Element;
	description: string;
}

const useTransactionFeedback = ({ isSuccess, hash, Link, description }: Params) => {
	//const { chain } = 'solana';

	//const { addRecentTransaction } = useTransactionFeedbackModal();
	const prevIsSuccessRef = useRef<boolean>(false);
	useEffect(() => {
		console.log(`hash is ${hash}`);
		if (hash!==undefined && isSuccess) {
			// addRecentTransaction({
			// 	hash,
			// 	description
			// });
			if (isSuccess && !prevIsSuccessRef.current) {
				prevIsSuccessRef.current = true;
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

	useEffect(() => {
		if (!isSuccess) {
		  prevIsSuccessRef.current = false;
		}
	  }, [isSuccess]);
};

export default useTransactionFeedback;
