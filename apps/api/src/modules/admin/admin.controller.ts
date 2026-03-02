import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { AdminGuard } from "../../common/admin.guard";
import { AdminService, type ResolveDisputeBody } from "./admin.service";

@Controller("admin")
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("orders")
  async listOrders(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
  ) {
    const params = {
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
      status: status as import("@hew/db").OrderStatus | undefined,
    };
    return this.adminService.listOrders(params);
  }

  @Get("orders/:id")
  async getOrder(@Param("id") id: string) {
    return this.adminService.getOrder(id);
  }

  @Get("sessions")
  async listSessions(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const params = {
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
    };
    return this.adminService.listSessions(params);
  }

  @Get("disputes")
  async listDisputes() {
    return this.adminService.listDisputes();
  }

  @Patch("disputes/:id/resolve")
  async resolveDispute(
    @Param("id") id: string,
    @Body() body: ResolveDisputeBody,
  ) {
    return this.adminService.resolveDispute(id, body);
  }

  @Get("payouts")
  async listPayouts() {
    return this.adminService.listPayouts();
  }

  @Post("payouts/:id/retry")
  async retryPayout(@Param("id") id: string) {
    return this.adminService.retryPayout(id);
  }
}
