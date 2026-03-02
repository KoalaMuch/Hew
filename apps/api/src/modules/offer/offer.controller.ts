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
import {
  createOfferSchema,
  type CreateOfferInput,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { OfferService } from "./offer.service";

const createOfferBodySchema = createOfferSchema
  .omit({ buyerSessionId: true })
  .refine(
    (data) => !!data.tripId || !!data.itemRequestId,
    "Either tripId or itemRequestId must be provided",
  );

@Controller("offers")
export class OfferController {
  constructor(private readonly offerService: OfferService) {}

  @Post()
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @SessionId() travelerSessionId: string,
    @Body() body: unknown,
  ) {
    const result = createOfferBodySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    const data: CreateOfferInput = {
      ...result.data,
      buyerSessionId: "", // Will be set by service from trip/itemRequest owner
    };
    return this.offerService.create(travelerSessionId, data);
  }

  @Get()
  async findAll(
    @Query("itemRequestId") itemRequestId?: string,
    @Query("tripId") tripId?: string,
  ) {
    if (itemRequestId) {
      return this.offerService.findByItemRequest(itemRequestId);
    }
    if (tripId) {
      return this.offerService.findByTrip(tripId);
    }
    throw new BadRequestException(
      "Either itemRequestId or tripId query parameter is required",
    );
  }

  @Patch(":id/accept")
  @UseGuards(SessionGuard)
  async accept(@Param("id") id: string, @SessionId() sessionId: string) {
    return this.offerService.accept(id, sessionId);
  }

  @Patch(":id/reject")
  @UseGuards(SessionGuard)
  async reject(@Param("id") id: string, @SessionId() sessionId: string) {
    return this.offerService.reject(id, sessionId);
  }
}
