import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import {
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { UploadService } from "./upload.service";

const MAX_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

@Controller("upload")
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseGuards(SessionGuard)
  @Throttle({ uploads: { ttl: 86400000, limit: 20 } })
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { fileSize: MAX_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const allowed = ALLOWED_IMAGE_TYPES.includes(
          file.mimetype as (typeof ALLOWED_IMAGE_TYPES)[number],
        );
        cb(null, allowed);
      },
    }),
  )
  async upload(
    @SessionId() _sessionId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body("folder") folder?: string,
  ) {
    if (!file) {
      throw new BadRequestException("No file provided");
    }
    if (file.size > MAX_SIZE_BYTES) {
      throw new BadRequestException(
        `File size must not exceed ${MAX_IMAGE_SIZE_MB}MB`,
      );
    }
    const validFolders = ["avatars", "posts"];
    const targetFolder =
      folder && validFolders.includes(folder) ? folder : "posts";
    return this.uploadService.upload(file.buffer, file.mimetype, targetFolder);
  }
}
