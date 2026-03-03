import { Controller, Get, Param } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(":sessionId/profile")
  async getPublicProfile(@Param("sessionId") sessionId: string) {
    return this.usersService.getPublicProfile(sessionId);
  }
}
