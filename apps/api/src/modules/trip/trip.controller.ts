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
import { TripStatus } from "@hew/db";
import {
  createTripSchema,
  type CreateTripInput,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { TripService } from "./trip.service";

@Controller("trips")
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @SessionId() sessionId: string,
    @Body() body: CreateTripInput,
  ) {
    const result = createTripSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.tripService.create(sessionId, result.data);
  }

  @Get()
  async findAll(
    @Query("country") country?: string,
    @Query("status") status?: TripStatus,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const filters = {
      country,
      status: status as TripStatus | undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : 20,
    };
    return this.tripService.findAll(filters);
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    return this.tripService.findById(id);
  }

  @Patch(":id")
  @UseGuards(SessionGuard)
  async update(
    @Param("id") id: string,
    @SessionId() sessionId: string,
    @Body() body: Partial<CreateTripInput>,
  ) {
    const result = createTripSchema.partial().safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.tripService.update(id, sessionId, result.data);
  }

  @Delete(":id")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(@Param("id") id: string, @SessionId() sessionId: string) {
    await this.tripService.cancel(id, sessionId);
  }
}
