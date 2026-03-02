import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";

@Module({
  controllers: [OrderController],
  providers: [OrderService, SessionGuard],
  exports: [OrderService],
})
export class OrderModule {}
