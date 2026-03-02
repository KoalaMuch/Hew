import {
  BadRequestException,
  Body,
  Controller,
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
import type { ItemRequestStatus } from "@hew/db";
import {
  createItemRequestSchema,
  type CreateItemRequestInput,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { ItemRequestService } from "./item-request.service";

@Controller("item-requests")
export class ItemRequestController {
  constructor(private readonly itemRequestService: ItemRequestService) {}

  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @SessionId() sessionId: string,
    @Body() body: CreateItemRequestInput,
  ) {
    const result = createItemRequestSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.itemRequestService.create(sessionId, result.data);
  }

  @Get()
  async findAll(
    @Query("country") country?: string,
    @Query("status") status?: ItemRequestStatus,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const filters = {
      country,
      status: status as ItemRequestStatus | undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    return this.itemRequestService.findAll(filters);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.itemRequestService.findById(id);
  }

  @Patch(":id")
  @UseGuards(SessionGuard)
  async update(
    @Param("id") id: string,
    @SessionId() sessionId: string,
    @Body() body: Partial<CreateItemRequestInput>,
  ) {
    const result = createItemRequestSchema.partial().safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.itemRequestService.update(id, sessionId, result.data);
  }
}
