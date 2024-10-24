import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand
} from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";

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
  image_url?: string;
}

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<AWSSignedUrlParams>
) => {
  try {
    if (req.method === "POST") {
      const data: any = await new Promise((resolve, reject) => {
        const form = formidable();
        form.parse(req, (err: any, fields: any) => {
          if (err) reject(err);
          resolve({ ...fields });
        });
      });

      if (!data?.address?.[0]) {
        return res.status(403).json({ error: `Forbidden access` });
      }

      const address = data?.address?.[0];
      const orderId = data?.orderId?.[0];
      const filename = data?.filename?.[0];
      const checkCase = data?.case?.[0];

      if (!address || !orderId) {
        return res.status(404).json({ error: `Data not found` });
      }

      if(checkCase=='2'){
        const folderPrefix = `disputes/${orderId}/${address}/`;

        try {
            // 1. List all objects with the folder prefix
            const listParams = {
                Bucket: process.env.AWS_IMAGES_BUCKET!,
                Prefix: folderPrefix, // This will list all objects under the folder
            };
            const listedObjects = await s3.send(new ListObjectsV2Command(listParams));

            // 2. Check if the folder contains any files
            if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
                return res.status(200).json({ error: "No objects found to delete." });
            }

            // 3. Prepare the delete operation
            const deleteParams = {
                Bucket: process.env.AWS_IMAGES_BUCKET!,
                Delete: {
                    Objects: listedObjects.Contents.map(({ Key }) => ({ Key })), // Map each object to be deleted
                },
            };

            // 4. Delete the listed objects
            const deleteCommand = new DeleteObjectsCommand(deleteParams);
            const resp = await s3.send(deleteCommand);

            return res.status(200).json({ data: resp });
        } catch (error) {
            console.error("Error deleting the folder contents:", error);
            return res.status(500).json({ error: "Error deleting the folder contents" });
        }
      }else{
        if (!filename) {
            return res.status(404).json({ error: `Data not found` });
          }
            const deleting_params = {
                Bucket: process.env.AWS_IMAGES_BUCKET!,
                Key: `disputes/${orderId}/${address}/${filename}`,
            };
    
            try {
                const delete_command = new DeleteObjectCommand(deleting_params);
                const resp = await s3.send(delete_command);
                return res.status(200).json({ data: resp });
            } catch (error) {
                console.error("Error deleting the object:", error);
                return res.status(500).json({ error: "Error deleting the image" });
            }    
      }
    }
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Error uploading the selected image" });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
