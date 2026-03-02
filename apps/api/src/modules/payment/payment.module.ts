import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { OrderModule } from "../order/order.module";
import { PaymentController } from "./payment.controller";
import { PaymentService } from "./payment.service";

@Module({
  imports: [OrderModule],
  controllers: [PaymentController],
  providers: [PaymentService, SessionGuard],
  exports: [PaymentService],
})
export class PaymentModule {}
