import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ZodError } from "zod";
import {
  shipOrderSchema,
  updateShippingSchema,
  type ShipOrderInput,
  type UpdateShippingInput,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { ShipmentService } from "./shipment.service";

@Controller("orders")
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Patch(":id/ship")
  @UseGuards(SessionGuard)
  async ship(
    @Param("id") orderId: string,
    @SessionId() sessionId: string,
    @Body() body: unknown,
  ) {
    const result = shipOrderSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    const data = result.data as ShipOrderInput;
    return this.shipmentService.markShipped(orderId, sessionId, data);
  }

  @Patch(":id/shipment")
  @UseGuards(SessionGuard)
  async updateShipping(
    @Param("id") orderId: string,
    @SessionId() sessionId: string,
    @Body() body: unknown,
  ) {
    const result = updateShippingSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    const data = result.data as UpdateShippingInput;
    return this.shipmentService.updateShipping(orderId, sessionId, data);
  }

  @Get(":id/shipment")
  @UseGuards(SessionGuard)
  async getShipment(
    @Param("id") orderId: string,
    @SessionId() sessionId: string,
  ) {
    return this.shipmentService.getShipment(orderId, sessionId);
  }
}
