// import makeBlockie from 'ethereum-blockies-base64';
import { User } from 'models/types';
import Image from 'next/image';
import React from 'react';
import profilePlaceholder from 'public/profile_placeholder.png'

const Avatar = ({ user, className = 'h-8 w-8 md:h-10 md:w-10' }: { user: User; className?: string }) => {
	const { image_url: imageURL } = user;

	let src;

	if(imageURL){
		src = imageURL;
	}
	// @ts-ignore
	else if(user?.image && user.image!=="" && user.image!==null){
		// @ts-ignore
		src = `${process.env.NEXT_PUBLIC_AWS_CLOUD_FRONT!}/profile_images/${user?.image}`;
	}else{
		src =  profilePlaceholder; //user.address ? makeBlockie(user.address) :
	}

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
