import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { CommentController } from "./comment.controller";
import { CommentService } from "./comment.service";

@Module({
  controllers: [CommentController],
  providers: [CommentService, SessionGuard],
  exports: [CommentService],
})
export class CommentModule {}
