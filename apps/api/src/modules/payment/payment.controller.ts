import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ZodError } from "zod";
import { guestCheckoutSchema, type GuestCheckoutInput } from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { PaymentService } from "./payment.service";

@Controller("payments")
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post("charge")
  @UseGuards(SessionGuard)
  async charge(
    @SessionId() sessionId: string,
    @Body() body: unknown,
  ) {
    const result = guestCheckoutSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    const data = result.data as GuestCheckoutInput;
    return this.paymentService.initiatePayment(data.orderId, sessionId, data);
  }

  @Post("webhook/omise")
  async omiseWebhook(@Body() payload: unknown) {
    if (
      !payload ||
      typeof payload !== "object" ||
      !("key" in payload) ||
      !("id" in payload)
    ) {
      throw new BadRequestException("Invalid webhook payload");
    }
    return this.paymentService.handleWebhook(
      payload as { id: string; key: string; [key: string]: unknown },
    );
  }

  @Get("order/:orderId/status")
  @UseGuards(SessionGuard)
  async getPaymentStatus(
    @Param("orderId") orderId: string,
    @SessionId() sessionId: string,
  ) {
    return this.paymentService.getPaymentStatus(orderId, sessionId);
  }
}
