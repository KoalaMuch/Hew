import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { ReviewService } from "./review.service";
import {
  createReviewSchema,
  type CreateReviewInput,
} from "@hew/shared";

@Controller("reviews")
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(SessionGuard)
  async create(
    @SessionId() sessionId: string,
    @Body() body: CreateReviewInput,
  ) {
    const data = createReviewSchema.parse(body);
    return this.reviewService.create(sessionId, data);
  }

  @Get()
  async findBySession(@Query("sessionId") sessionId: string) {
    if (!sessionId) {
      return [];
    }
    return this.reviewService.findBySession(sessionId);
  }
}
