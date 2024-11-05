import React from 'react';

import { CheckCircleIcon } from '@heroicons/react/20/solid';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

interface StepsProps {
	stepsCount: number;
	currentStep: number;
	onStepClick?: (step: number) => void;
}

const Steps = ({ currentStep, onStepClick, stepsCount }: StepsProps) => (
	<nav aria-label="Progress" className="w-full hidden md:block">
		<ol className="w-full flex items-center justify-between">
			{Array.from({ length: stepsCount + 1 }, (_, i) => i + 1).map((number) => {
				const futureStep = currentStep < number;
				const actualStep = currentStep === number;
				const pastStep = currentStep > number;
				const isTheLastStep = number === stepsCount + 1;

				return (
					<li
						key={number}
						className={classNames(!isTheLastStep ? 'w-full sm:pr-20' : '', 'relative')}
						onClick={pastStep && !!onStepClick ? () => onStepClick(number) : undefined}
					>
						<>
							<div className="w-full absolute inset-0 flex items-center" aria-hidden="true">
								<div className={`h-0.5 w-full ${pastStep ? 'bg-purple-900' : 'bg-gray-200'}`} />
							</div>
							<button
								type="button"
								className={`${pastStep && 'group bg-purple-900 hover:bg-purple-900 text-white'} ${
									actualStep && 'border-2 border-purple-900 bg-white text-purple-900'
								} ${
									futureStep &&
									' border-2 border-gray-300 bg-white hover:border-gray-400 text-gray-400'
								} relative flex h-8 w-8 items-center justify-center rounded-full cursor-pointer`}
							>
								{isTheLastStep ? <CheckCircleIcon /> : number}
								<span className="sr-only">{number}</span>
							</button>
						</>
					</li>
				);
			})}
		</ol>
	</nav>
);

export default Steps;
