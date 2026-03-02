import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { DisputeService } from "./dispute.service";
import {
  createDisputeSchema,
  type CreateDisputeInput,
} from "@hew/shared";

@Controller("disputes")
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  @Post("orders/:id/dispute")
  @UseGuards(SessionGuard)
  async create(
    @Param("id") orderId: string,
    @SessionId() sessionId: string,
    @Body() body: Omit<CreateDisputeInput, "orderId">,
  ) {
    const data = createDisputeSchema.parse({ ...body, orderId });
    return this.disputeService.create(orderId, sessionId, data);
  }

  @Get()
  @UseGuards(SessionGuard)
  async findAll(@SessionId() sessionId: string) {
    return this.disputeService.findBySession(sessionId);
  }

  @Get(":id")
  @UseGuards(SessionGuard)
  async findById(@Param("id") id: string, @SessionId() sessionId: string) {
    const dispute = await this.disputeService.findById(id);
    const isBuyer = dispute.order.buyerSessionId === sessionId;
    const isTraveler = dispute.order.travelerSessionId === sessionId;
    if (!isBuyer && !isTraveler) {
      throw new ForbiddenException("You do not have access to this dispute");
    }
    return dispute;
  }
}
