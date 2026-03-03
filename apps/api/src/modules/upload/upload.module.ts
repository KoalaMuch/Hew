import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { UploadController } from "./upload.controller";
import { UploadService } from "./upload.service";

@Module({
  controllers: [UploadController],
  providers: [UploadService, SessionGuard],
  exports: [UploadService],
})
export class UploadModule {}
