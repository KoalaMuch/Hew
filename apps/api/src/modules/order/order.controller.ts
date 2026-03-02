import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { OrderService } from "./order.service";

@Controller("orders")
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @UseGuards(SessionGuard)
  async findAll(
    @SessionId() sessionId: string,
    @Query("role") role?: "buyer" | "traveler",
  ) {
    return this.orderService.findBySession(sessionId, role);
  }

  @Get(":id")
  @UseGuards(SessionGuard)
  async findById(@Param("id") id: string, @SessionId() sessionId: string) {
    const order = await this.orderService.findById(id);
    const isBuyer = order.buyerSessionId === sessionId;
    const isTraveler = order.travelerSessionId === sessionId;
    if (!isBuyer && !isTraveler) {
      throw new ForbiddenException("You do not have access to this order");
    }
    return order;
  }

  @Patch(":id/deliver")
  @UseGuards(SessionGuard)
  async confirmDelivery(@Param("id") id: string, @SessionId() sessionId: string) {
    return this.orderService.confirmDelivery(id, sessionId);
  }
}
