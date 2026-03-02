import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from "@nestjs/common";
import { Request, Response } from "express";
import { PrismaService } from "./prisma.service";
import { SESSION_COOKIE_NAME, SESSION_TOKEN_HEADER } from "@hew/shared";
import { SESSION_ID_KEY } from "./session.decorator";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const token =
      (request.cookies?.[SESSION_COOKIE_NAME] as string | undefined) ??
      (request.headers[SESSION_TOKEN_HEADER] as string | undefined);

    let sessionId: string;

    if (token) {
      const session = await this.prisma.session.findUnique({
        where: { id: token },
      });

      if (session) {
        sessionId = session.id;
        await this.prisma.session.update({
          where: { id: session.id },
          data: { lastActiveAt: new Date() },
        });
      } else {
        sessionId = await this.createSession(response);
      }
    } else {
      sessionId = await this.createSession(response);
    }

    (request as any)[SESSION_ID_KEY] = sessionId;
    return true;
  }

  private async createSession(response: Response): Promise<string> {
    const session = await this.prisma.session.create({
      data: {},
    });

    const isProduction = process.env.NODE_ENV === "production";

    response.cookie(SESSION_COOKIE_NAME, session.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
    });

    return session.id;
  }
}
