import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { PostController } from "./post.controller";
import { PostService } from "./post.service";

@Module({
  controllers: [PostController],
  providers: [PostService, SessionGuard],
  exports: [PostService],
})
export class PostModule {}
