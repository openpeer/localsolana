// import makeBlockie from 'ethereum-blockies-base64';
import { User } from 'models/types';
import Image from 'next/image';
import React from 'react';
import profilePlaceholder from 'public/ooui_user-avatar.svg'

const Avatar = ({ user, className = 'h-8 w-8 md:h-10 md:w-10' }: { user: User; className?: string }) => {
	const { image_url: imageURL } = user;

	let src = (imageURL)?`${process.env.NEXT_PUBLIC_AWS_CLOUD_FRONT!}/profile_images/${imageURL}`:profilePlaceholder;

	return (
		<Image
			className={`${className} object-cover rounded-full`}
			src={src}
			alt="Avatar"
			width={32}
			height={32}
			unoptimized
			priority
		/>
	);
};

export default Avatar;
