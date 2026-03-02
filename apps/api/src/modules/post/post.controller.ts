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
import type { PostType } from "@hew/db";
import {
  createPostSchema,
  updatePostSchema,
  type CreatePostInput,
  type UpdatePostInput,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { PostService } from "./post.service";

@Controller("posts")
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @SessionId() sessionId: string,
    @Body() body: CreatePostInput,
  ) {
    const result = createPostSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.postService.create(sessionId, result.data);
  }

  @Get()
  async findAll(
    @Query("type") type?: PostType,
    @Query("hashtag") hashtag?: string,
    @Query("search") search?: string,
    @Query("country") country?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.postService.findAll({
      type: type as PostType | undefined,
      hashtag,
      search,
      country,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @Get("mine")
  @UseGuards(SessionGuard)
  async findMine(
    @SessionId() sessionId: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.postService.findBySession(
      sessionId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get("hashtags/trending")
  async getTrendingHashtags(@Query("limit") limit?: string) {
    return this.postService.getTrendingHashtags(
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.postService.findById(id);
  }

  @Patch(":id")
  @UseGuards(SessionGuard)
  async update(
    @Param("id") id: string,
    @SessionId() sessionId: string,
    @Body() body: UpdatePostInput,
  ) {
    const result = updatePostSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.postService.update(id, sessionId, result.data);
  }

  @Delete(":id")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string, @SessionId() sessionId: string) {
    await this.postService.remove(id, sessionId);
  }
}
