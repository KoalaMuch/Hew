import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ZodError } from "zod";
import {
  createOrderFromChatSchema,
  type CreateOrderFromChatInput,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { OrderService } from "./order.service";
import { ChatService } from "../chat/chat.service";
import { ChatGateway } from "../chat/chat.gateway";

@Controller("orders")
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

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

  @Post("from-chat")
  @UseGuards(SessionGuard)
  async createFromChat(
    @SessionId() sessionId: string,
    @Body() body: unknown,
  ) {
    const result = createOrderFromChatSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    const data = result.data as CreateOrderFromChatInput;
    const order = await this.orderService.createFromChat(sessionId, data);
    const message = await this.chatService.sendOrderCardMessage(
      data.roomId,
      sessionId,
      order,
    );
    this.chatGateway.emitMessageToRoom(data.roomId, message);
    return this.orderService.findById(order.id);
  }

  @Patch(":id/cancel")
  @UseGuards(SessionGuard)
  async cancel(@Param("id") id: string, @SessionId() sessionId: string) {
    return this.orderService.cancel(id, sessionId);
  }

  @Patch(":id/deliver")
  @UseGuards(SessionGuard)
  async confirmDelivery(@Param("id") id: string, @SessionId() sessionId: string) {
    return this.orderService.confirmDelivery(id, sessionId);
  }
}
