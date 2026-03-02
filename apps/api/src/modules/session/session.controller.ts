import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ZodError } from "zod";
import { Response } from "express";
import { SESSION_COOKIE_NAME } from "@hew/shared";
import { updateSessionSchema, type UpdateSessionInput } from "@hew/shared";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { SessionService } from "./session.service";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

@Controller("sessions")
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Body("fingerprint") fingerprint: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.sessionService.createSession(fingerprint);

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie(SESSION_COOKIE_NAME, session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });

    return session;
  }

  @Get("me")
  @UseGuards(SessionGuard)
  async getMe(@SessionId() sessionId: string) {
    const session = await this.sessionService.getSession(sessionId);
    if (!session) {
      return null;
    }
    return session;
  }

  @Patch("me")
  @UseGuards(SessionGuard)
  async updateMe(
    @SessionId() sessionId: string,
    @Body() body: UpdateSessionInput,
  ) {
    const result = updateSessionSchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(
        (result.error as ZodError).errors.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      );
    }
    return this.sessionService.updateSession(sessionId, result.data);
  }
}
