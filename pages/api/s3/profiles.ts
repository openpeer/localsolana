import {
  S3Client,
  PutObjectCommand,
  PutObjectCommandOutput,
  DeleteObjectCommand,
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
      const data: { fields: any; files: any } = await new Promise(
        (resolve, reject) => {
          const form = formidable();

          form.parse(req, (err: any, fields: any, files: any) => {
            if (err) reject(err);
            resolve({ fields, files });
          });
        }
      );

      const { file } = data.files;
      const user_existing_image_url = data.fields.user_existing_image_url[0]!;

      if (user_existing_image_url) {
        const deleting_params = {
          Bucket: process.env.AWS_IMAGES_BUCKET!,
          Key: `profile_images/${user_existing_image_url}`,
        };

        try {
          const delete_command = new DeleteObjectCommand(deleting_params);
          const resp = await s3.send(delete_command);
        } catch (error) {
          console.error("Error deleting the object:", error);
        }
      }

      const fileContent = fs.readFileSync(file[0].filepath);
      const appendNumberInImage = (user_existing_image_url.includes("_1"))?2:1; // If I'm using the same image name again then aws giving me older image. That's why incldued it/ 
      const imageNewName = `${data.fields.address}_${appendNumberInImage}.${file[0].originalFilename
        .split(".")
        .pop()}`;
      const key = `profile_images/${imageNewName}`;

      const adding_params = {
        Bucket: process.env.AWS_IMAGES_BUCKET!,
        Key: key,
        Body: fileContent,
      };

      // Use the PutObjectCommand to upload the file
      const command = new PutObjectCommand(adding_params);
      const uploadData = await s3.send(command);
      return res
        .status(200)
        .json({ data: uploadData, image_url: imageNewName });
    }

    // Handle any other HTTP method
    return res
      .status(405)
      .json({ error: `Method '${req.method}' Not Allowed` });
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
