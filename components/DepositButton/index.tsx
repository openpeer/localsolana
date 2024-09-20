import React, { useState } from 'react';
import { DepositFundsParams } from './DepositFundsButton.types';
import DepositFundsButton from './DepositFundsButton';

const DepositFunds = ({ token, tokenAmount, contract, disabled }: DepositFundsParams) => {
	const nativeToken = token.address === "LocalSolanaAdress";
	const [approved, setApproved] = useState(nativeToken);

	return (
		<span className="w-full">
			<>
				{( (
					<DepositFundsButton
						token={token}
						tokenAmount={tokenAmount}
						contract={contract}
						disabled={disabled}
					/>
				))}
				{/* {!nativeToken && (
					<div className={nativeToken || approved ? 'hidden' : ''}>
						<ApproveTokenButton
							token={token}
							amount={tokenAmount}
							spender={contract}
							onApprovalChange={setApproved}
						/>
					</div>
				)} */}
			</>
		</span>
	);
};

export default DepositFunds;
