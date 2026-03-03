import { BadGatewayException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import {
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
} from "@hew/shared";

const VALID_FOLDERS = ["avatars", "posts"] as const;

@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {}

  async upload(
    buffer: Buffer,
    mimetype: string,
    folder?: string,
  ): Promise<{ url: string }> {
    const cloudName = this.config.get<string>("CLOUDINARY_CLOUD_NAME");
    const apiKey = this.config.get<string>("CLOUDINARY_API_KEY");
    const apiSecret = this.config.get<string>("CLOUDINARY_API_SECRET");

    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadGatewayException("Image upload is not configured");
    }

    if (!ALLOWED_IMAGE_TYPES.includes(mimetype as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      throw new BadGatewayException(
        "Invalid file type. Allowed: JPEG, PNG, WebP",
      );
    }

    const targetFolder =
      folder && VALID_FOLDERS.includes(folder as (typeof VALID_FOLDERS)[number])
        ? folder
        : "posts";

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: targetFolder,
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(
              new BadGatewayException(
                error.message || "Upload to Cloudinary failed",
              ),
            );
          } else if (result?.secure_url) {
            resolve({ url: result.secure_url });
          } else {
            reject(new BadGatewayException("Upload failed"));
          }
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }
}
