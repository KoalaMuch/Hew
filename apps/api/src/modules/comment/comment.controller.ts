import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ZodError } from "zod";
import {
  createCommentSchema,
  updateCommentSchema,
  type CreateCommentInput,
  type UpdateCommentInput,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { CommentService } from "./comment.service";

@Controller("posts/:postId/comments")
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  @UseGuards(SessionGuard)
  async findAll(
    @Param("postId") postId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.commentService.findByPost(
      postId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param("postId") postId: string,
    @SessionId() sessionId: string,
    @Body() body: CreateCommentInput,
  ) {
    const result = createCommentSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.commentService.create(postId, sessionId, result.data);
  }

  @Patch(":id")
  @UseGuards(SessionGuard)
  async update(
    @Param("postId") postId: string,
    @Param("id") id: string,
    @SessionId() sessionId: string,
    @Body() body: UpdateCommentInput,
  ) {
    const result = updateCommentSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.commentService.update(postId, id, sessionId, result.data);
  }

  @Delete(":id")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param("postId") postId: string,
    @Param("id") id: string,
    @SessionId() sessionId: string,
  ) {
    await this.commentService.remove(postId, id, sessionId);
  }
}
