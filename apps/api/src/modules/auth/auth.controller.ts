import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { ZodError } from "zod";
import {
  registerSchema,
  loginSchema,
  type RegisterInput,
  type LoginInput,
  SESSION_COOKIE_NAME,
} from "@hew/shared";
import { ConfigService } from "@nestjs/config";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { AuthService } from "./auth.service";
import { OAuthService } from "./oauth/oauth.service";
import type { OAuthProvider } from "./oauth/oauth.types";

const VALID_PROVIDERS = new Set<OAuthProvider>([
  "google",
  "line",
  "facebook",
  "apple",
]);

@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  @UseGuards(SessionGuard)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
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
  @Throttle({ short: { ttl: 60000, limit: 5 } })
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

  @Get(":provider")
  async oauthRedirect(
    @Param("provider") provider: string,
    @Query("session") sessionId: string,
    @Res() res: Response,
  ) {
    if (!VALID_PROVIDERS.has(provider as OAuthProvider)) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
    if (!sessionId) {
      throw new BadRequestException("session query parameter is required");
    }
    const url = this.oauthService.getAuthorizationUrl(
      provider as OAuthProvider,
      sessionId,
    );
    res.redirect(url);
  }

  @Get(":provider/callback")
  async oauthCallback(
    @Param("provider") provider: string,
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() res: Response,
  ) {
    if (!VALID_PROVIDERS.has(provider as OAuthProvider)) {
      throw new BadRequestException(`Unsupported provider: ${provider}`);
    }

    const frontendUrl =
      this.config.get<string>("FRONTEND_URL") || "http://localhost:3001";

    try {
      const { sessionId } = JSON.parse(
        Buffer.from(state, "base64url").toString(),
      ) as { sessionId: string };

      const profile = await this.oauthService.exchangeCode(
        provider as OAuthProvider,
        code,
      );
      await this.authService.loginWithOAuth(sessionId, profile);

      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 365 * 24 * 60 * 60,
      });

      res.redirect(`${frontendUrl}/auth/callback?success=true`);
    } catch (err) {
      this.logger.error(
        `OAuth ${provider} callback failed: ${err instanceof Error ? err.message : err}`,
        err instanceof Error ? err.stack : undefined,
      );
      res.redirect(`${frontendUrl}/auth/callback?error=auth_failed`);
    }
  }
}
