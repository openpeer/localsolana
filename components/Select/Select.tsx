import Flag from 'components/Flag/Flag';
import Token from 'components/Token/Token';
import { countries } from 'models/countries';
import { Token as TokenModel } from 'models/types';
import Image from 'next/image';
import React, { Fragment } from 'react';

import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

import SearchBar from './SearchBar';
import { SelectProps } from './Select.types';

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ');
}

export default function Select({
	label,
	options,
	selected,
	onSelect,
	error,
	onSearch,
	minimal = false,
	height = '',
	rounded = false,
	flag = false,
	token = false,
	network = false,
	labelStyle = '',
	extraStyle = ''
}: SelectProps) {
	return (
		<Listbox value={selected} onChange={onSelect}>
			{({ open }) => (
				<div className={`my-8 ${minimal ? 'pr-1.5' : ''} ${extraStyle}`}>
					{!minimal && (
						<Listbox.Label className={`block text-base font-medium text-gray-700 ${labelStyle}`}>
							{label}
						</Listbox.Label>
					)}

					<div className={`relative ${minimal ? '' : 'mt-1'}`}>
						<Listbox.Button
							className={`bg-gray-100 relative w-full cursor-default rounded-md py-2 pl-3 text-left sm:text-sm ${
								minimal
									? 'pr-7 h-12 bg-gray-100'
									: `${height} pr-10 border border-gray-100 bg-white shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500`
							}`}
						>
							<span className="flex items-center">
								{!!selected &&
									(token ? (
										<Token token={selected as TokenModel} size={24} />
									) : flag ? (
										<Flag name={countries[selected.icon!]} size={24} />
									) : (
										!!selected.icon && (
											<Image
												src={selected.icon}
												alt={selected.name}
												className={`${rounded ? 'rounded-full' : ''} h-6 w-6 flex-shrink-0`}
												width={24}
												height={24}
												unoptimized
											/>
										)
									))}
								<span className={`${minimal ? 'ml-1' : 'ml-3'} block truncate`}>
									{selected?.name || 'Select'}
								</span>
							</span>
							<span className="bg-gray-100 pointer-events-none rounded-md absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
								{minimal ? (
									open ? (
										<ChevronUpIcon className="h-5 w-5 text-gray-800" aria-hidden="true" />
									) : (
										<ChevronDownIcon className="h-5 w-5 text-gray-800" aria-hidden="true" />
									)
								) : (
									<ChevronDownIcon className="h-5 w-5 text-gray-800" aria-hidden="true" />
								)}
							</span>
						</Listbox.Button>

						<Transition
							show={open}
							as={Fragment}
							leave="transition ease-in duration-100"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<Listbox.Options className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
								{!!onSearch && (
									<SearchBar id="currencySearch" placeholder="Search..." onSearch={onSearch} />
								)}
								{options.map((option) => (
									<Listbox.Option
										key={option.id}
										className={
											({ active }) =>
												classNames(
													active ? 'text-white bg-indigo-600' : 'text-gray-900',
													'relative cursor-default select-none py-2 pl-3'
												)
											// eslint-disable-next-line react/jsx-curly-newline
										}
										value={option}
									>
										{({ selected: selectedOption, active }) => (
											<>
												<div className="flex items-center">
													{token ? (
														<Token token={option as TokenModel} size={24} />
													) : flag ? (
														<Flag name={countries[option.icon!]} size={24} />
													) : (
														!!option.icon && (
															<Image
																src={option.icon}
																alt={option.name}
																className={`${
																	rounded ? 'rounded-full' : ''
																} h-6 w-6 flex-shrink-0`}
																width={24}
																height={24}
																unoptimized
															/>
														)
													)}

													<span
														className={classNames(
															selectedOption ? 'font-semibold' : 'font-normal',
															minimal ? 'ml-1' : 'ml-3',
															'block truncate'
														)}
													>
														{option.name}
													</span>
												</div>

												{selectedOption && !minimal && (
													<span
														className={classNames(
															active ? 'text-white' : 'text-indigo-600',
															'absolute inset-y-0 right-0 flex items-center pr-4'
														)}
													>
														<CheckIcon className="h-5 w-5" aria-hidden="true" />
													</span>
												)}
											</>
										)}
									</Listbox.Option>
								))}
							</Listbox.Options>
						</Transition>
					</div>
					{!!error && <p className="mt-2 text-sm text-red-600">{error}</p>}
				</div>
			)}
		</Listbox>
	);
}

/*
import React from 'react';
import Select from 'react-select';
import Flag from 'components/Flag/Flag';
import Token from 'components/Token/Token';
import { countries } from 'models/countries';
import { Token as TokenModel } from 'models/types';
import Image from 'next/image';
import { SelectProps } from './Select.types';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';


// Custom single value component
const CustomSingleValue = ({ data, token, flag, rounded }) => (	
	<div className="flex items-center">
	  {token ? (
		<Token token={data as TokenModel} size={24} />
	  ) : flag ? (
		<Flag name={countries[data.icon!]} size={24} />
	  ) : (
		!!data.icon && (
		  <Image
			src={data.icon}
			alt={data.label}
			className={`${rounded ? 'rounded-full' : ''} h-6 w-6 flex-shrink-0`}
			width={24}
			height={24}
			unoptimized
		  />
		)
	  )}
	  <span className="ml-3 block truncate">{data.label || 'Select'}</span>
	</div>
  );
  
  // Custom option component
  const CustomOption = (props) => {
	const { data, innerRef, innerProps, isFocused, isSelected } = props;
	return (
	  <div
		ref={innerRef}
		{...innerProps}
		className={`flex items-center cursor-pointer select-none py-2 pl-3 ${
		  isSelected ? 'bg-indigo-600 text-white' : isFocused ? 'bg-gray-200' : 'text-gray-900'
		}`}
	  >
		{data.token ? (
		  <Token token={data as TokenModel} size={24} />
		) : data.flag ? (
		  <Flag name={countries[data.icon!]} size={24} />
		) : (
		  !!data.icon && (
			<Image
			  src={data.icon}
			  alt={data.label}
			  className={`h-6 w-6 flex-shrink-0 ${data.rounded ? 'rounded-full' : ''}`}
			  width={24}
			  height={24}
			  unoptimized
			/>
		  )
		)}
		<span className={`ml-3 block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
		  {data.label}
		</span>
		{isSelected && !props.selectProps.isMulti && (
		  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
			<CheckIcon className="h-5 w-5" aria-hidden="true" />
		  </span>
		)}
	  </div>
	);
  };
  
  export default function SelectComponent({
	label,
	options,
	selected,
	onSelect,
	error,
	onSearch,
	minimal = false,
	height = '',
	rounded = false,
	flag = false,
	token = false,
	network = false,
	labelStyle = '',
	extraStyle = ''
  }: SelectProps) {
	const formattedOptions = options.map(option => ({
	  value: option,
	  label: option.name,
	  icon: option.icon,
	  token: token,
	  flag: flag,
	  rounded: rounded
	}));
  
	return (
	  <div className={`my-8 ${minimal ? 'pr-1.5' : ''} ${extraStyle}`}>
		{!minimal && (
		  <label className={`block text-base font-medium text-gray-700 ${labelStyle}`}>
			{label}
		  </label>
		)}
		<div className={`relative ${minimal ? '' : 'mt-1'}`}>
		  <Select
			value={selected ? { value: selected.id, label: selected.name, icon: selected.icon } : null}
			onChange={(option) => onSelect(option)}
			options={formattedOptions}
			// components={{ SingleValue: CustomSingleValue, Option: CustomOption }}
			placeholder="Select"
			isClearable
			isSearchable={!!onSearch}
			styles={{
			  control: (provided) => ({
				...provided,
				height: minimal ? '3rem' : height,
				border: '1px solid #e5e7eb',
				boxShadow: 'none',
				'&:hover': {
				  border: '1px solid #6366f1'
				}
			  }),
			  menu: (provided) => ({
				...provided,
				zIndex: 10
			  }),
			  option: (provided, state) => ({
				...provided,
				backgroundColor: state.isSelected ? '#4f46e5' : state.isFocused ? '#e5e7eb' : null,
				color: state.isSelected ? 'white' : 'black'
			  })
			}}
		  />
		  {!!error && <p className="mt-2 text-sm text-red-600">{error}</p>}
		</div>
	  </div>
	);
  }
  */