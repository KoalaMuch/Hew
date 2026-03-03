import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { ChatModule } from "../chat/chat.module";
import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";

@Module({
  imports: [ChatModule],
  controllers: [OrderController],
  providers: [OrderService, SessionGuard],
  exports: [OrderService],
})
export class OrderModule {}
