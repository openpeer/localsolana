import { User } from "@/models/types";
import { S3Client, PutObjectCommand, PutObjectCommandOutput } from "@aws-sdk/client-s3";
import React, { useEffect, useState } from 'react';

const MAX_FILE_SIZE = 1000000; // 1 MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

interface ImageUploaderParams {
	user:User,
	address: string;
	onUploadFinished?: (data: PutObjectCommandOutput, image_url:string) => void;
}

const ImageUploader = ({user, address, onUploadFinished }: ImageUploaderParams) => {
	const [file, setFile] = useState<File>();
	const [error, setError] = useState('');
	const [isUploading, setIsUploading] = useState(false);

	const handleFileChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
		if (!target.files) return;
		const selectedFile = target.files[0];
		if (!selectedFile) {
			return;
		}
		if (selectedFile.size > MAX_FILE_SIZE) {
			setError('File size exceeds 1 MB');
			return;
		}
		if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
			setError('File type must be jpeg, png, or gif');
			return;
		}
		setFile(selectedFile);
		setError('');
	};

	useEffect(() => {
		if (file) {
			setIsUploading(true);
			const formData = new FormData();
			formData.append('address', address);
			formData.append('file', file);
			formData.append('user_existing_image_url',user.image_url!);
           
			fetch('/api/s3/profiles', {
				method: 'POST',
				body: formData,
				headers: {
					Accept: ALLOWED_FILE_TYPES.join(', ')
				}
			})
				.then((res) => res.json())
				.then(({ data,image_url }) => {
					if (data.error) {
						setError(data.error);
					} else {
						onUploadFinished?.(data,image_url);
					}
				})
                .catch((err)=>{
                    console.log(err.message);
                })
                .finally(()=>{
                    setIsUploading(false);
                });
		}
	}, [file]);

	return (
		<div>
			<label
				htmlFor="file-input"
				className="w-full px-2 py-2.5 rounded border border-purple-900 text-base text-purple-900 hover:bg-purple-900 hover:text-white my-8 cursor-pointer"
			>
				{isUploading ? 'Uploading...' : 'Upload'}
			</label>
			<input
				type="file"
				id="file-input"
				className="hidden"
				accept={ALLOWED_FILE_TYPES.join(',')}
				multiple={false}
				onChange={handleFileChange}
				disabled={isUploading}
			/>
			{!!error && <p style={{ color: 'red' }}>{error}</p>}
		</div>
	);
};

export default ImageUploader;
