import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { PayoutService } from "./payout.service";

@Controller("payouts")
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get()
  @UseGuards(SessionGuard)
  async findAll(@SessionId() sessionId: string) {
    return this.payoutService.findBySession(sessionId);
  }

  @Get(":id")
  @UseGuards(SessionGuard)
  async findById(@Param("id") id: string, @SessionId() sessionId: string) {
    const payout = await this.payoutService.findById(id);
    if (payout.travelerSessionId !== sessionId) {
      throw new ForbiddenException("You do not have access to this payout");
    }
    return payout;
  }
}
