import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ZodError } from "zod";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
} from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.CREATED)
  async register(
    @SessionId() sessionId: string,
    @Body() body: RegisterInput,
  ) {
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.authService.register(sessionId, result.data);
  }

  @Post("login")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @SessionId() sessionId: string,
    @Body() body: LoginInput,
  ) {
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.authService.login(sessionId, result.data);
  }

  @Get("profile")
  @UseGuards(SessionGuard)
  async getProfile(@SessionId() sessionId: string) {
    return this.authService.getProfile(sessionId);
  }

  @Post("logout")
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@SessionId() sessionId: string) {
    await this.authService.logout(sessionId);
  }
}
