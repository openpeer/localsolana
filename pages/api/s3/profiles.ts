import { S3Client, PutObjectCommand, PutObjectCommandOutput } from '@aws-sdk/client-s3';
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


interface AWSSignedUrlParams {
  data?: PutObjectCommandOutput;
  error?: string;
  imageName?: string;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<AWSSignedUrlParams>) => {
  try {
    if (req.method === 'POST') {
		const data: { fields: any; files: any } = await new Promise((resolve, reject) => {
        const form = formidable();

        form.parse(req, (err: any, fields: any, files: any) => {
          if (err) reject(err);
          resolve({ fields, files });
        });
      });

      const { file } = data.files;

      const fileContent = fs.readFileSync(file[0].filepath);
	  const imageNewName = `${data.fields.address}.${file[0].originalFilename.split('.').pop()}`;
	  const key=`profile_images/${imageNewName}`;

	  
      const params = {
        Bucket: process.env.AWS_IMAGES_BUCKET!,
        Key: key,
        Body: fileContent,
      };
	  
      // Use the PutObjectCommand to upload the file
      const command = new PutObjectCommand(params);
      const uploadData = await s3.send(command);
      return res.status(200).json({ data: uploadData, imageName:imageNewName  });
    }
    
    // Handle any other HTTP method
    return res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  } catch (err) {
    return res.status(500).json({ error: 'Error uploading the selected image' });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
