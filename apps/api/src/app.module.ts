import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SessionModule } from "./modules/session/session.module";
import { TripModule } from "./modules/trip/trip.module";
import { ItemRequestModule } from "./modules/item-request/item-request.module";
import { OfferModule } from "./modules/offer/offer.module";
import { OrderModule } from "./modules/order/order.module";
import { PaymentModule } from "./modules/payment/payment.module";
import { ShipmentModule } from "./modules/shipment/shipment.module";
import { PayoutModule } from "./modules/payout/payout.module";
import { ChatModule } from "./modules/chat/chat.module";
import { DisputeModule } from "./modules/dispute/dispute.module";
import { ReviewModule } from "./modules/review/review.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { AdminModule } from "./modules/admin/admin.module";
import { PrismaModule } from "./common/prisma.module";
import { HealthController } from "./common/health.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    SessionModule,
    TripModule,
    ItemRequestModule,
    OfferModule,
    OrderModule,
    PaymentModule,
    ShipmentModule,
    PayoutModule,
    ChatModule,
    DisputeModule,
    ReviewModule,
    NotificationModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
