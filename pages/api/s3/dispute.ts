/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { S3Client, PutObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import formidable from 'formidable';
import fs from 'fs';

import type { NextApiRequest, NextApiResponse } from 'next';

// Initialize S3 client
const s3 = new S3Client({
	region: process.env.AWS_REGION!,
	credentials: {
	  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,  
	  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
	},
});

interface Upload {
	key: string;
	signedURL: string;
	filename: string;
}

interface AWSSignedUrlParams {
	data?: Upload[];
	error?: string;
}

// Function to generate signed URL
const generateSignedUrl = async (key: string) => {
	const params = {
		Bucket: process.env.AWS_IMAGES_BUCKET!,
		Key: key,
		Expires: 60, // URL expires in 60 seconds
	};

	const command = new GetObjectCommand({
		Bucket: params.Bucket,
		Key: params.Key,
	  });
	
	  try {
		const signedUrl = await getSignedUrl(s3, command, { expiresIn: params.Expires });
		const baseUrl = signedUrl.split('?')[0].replace('https://localsolanadisputes.s3.eu-north-1.amazonaws.com', process.env.AWS_CLOUD_FRONT!);		
	    return baseUrl;
	  } catch (err) {
		console.error("Error generating signed URL", err);
		throw err;
	  }
	
};

const handler = async (req: NextApiRequest, res: NextApiResponse<AWSSignedUrlParams>) => {
	try {
		if (req.method === 'POST') {
			const form = formidable({ multiples: true });
			const data: { fields: any; files: Record<string, formidable.File[]> } = await new Promise(
				(resolve, reject) => {
					form.parse(req, (err: any, fields: any, files: any) => {
						if (err) reject(err);
						resolve({ files, fields });
					});
				}
			);

			const uploads: Promise<any>[] = [];
			const signedUrls: Upload[] = [];
			const { uuid, address } = data.fields;

			for (const file of Object.values(data.files).flat()) {
				const fileContent = fs.readFileSync(file.filepath);
				// const key = `disputes/${uuid}/${address}/${file.originalFilename}`;
				const key = `disputes/${address}/${file.originalFilename}`;

				
				const params = {
					Bucket: process.env.AWS_IMAGES_BUCKET!,
					Key: key,
					Body: fileContent,
				};


				// Upload file to S3
				const uploadCommand = new PutObjectCommand(params);
				const upload = s3.send(uploadCommand);
				uploads.push(upload);

				// Generate signed URL
				const signedURL = await generateSignedUrl(key);

				signedUrls.push({ key, signedURL, filename: file.originalFilename! });
			}

			await Promise.all(uploads);

			return res.status(200).json({ data: signedUrls });
		}
		// Handle other HTTP methods
		return res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
	} catch (err) {
		return res.status(500).json({ error: 'Error uploading the selected files' });
	}
};

export const config = {
	api: {
		bodyParser: false,
	},
};

export default handler;
