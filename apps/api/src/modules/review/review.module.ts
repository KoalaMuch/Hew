import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { ReviewController } from "./review.controller";
import { ReviewService } from "./review.service";

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, SessionGuard],
  exports: [ReviewService],
})
export class ReviewModule {}
