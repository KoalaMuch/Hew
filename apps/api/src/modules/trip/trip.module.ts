import { Module } from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { TripController } from "./trip.controller";
import { TripService } from "./trip.service";

@Module({
  controllers: [TripController],
  providers: [TripService, SessionGuard],
  exports: [TripService],
})
export class TripModule {}
