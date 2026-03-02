import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { SESSION_ID_KEY } from "./session.decorator";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request[SESSION_ID_KEY] as string | undefined;

    if (!sessionId) {
      throw new ForbiddenException("Session required");
    }

    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { registeredUser: true },
    });

    if (
      !session?.registeredUserId ||
      !session.registeredUser ||
      session.registeredUser.role !== "ADMIN"
    ) {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}
