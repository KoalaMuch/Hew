import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(fingerprint?: string) {
    return this.prisma.session.create({
      data: fingerprint ? { deviceFingerprint: fingerprint } : {},
    });
  }

  async getSession(id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      include: {
        registeredUser: { select: { avatarUrl: true } },
      },
    });
    if (!session) return null;
    const { registeredUser, ...rest } = session;
    return {
      ...rest,
      avatarUrl: session.avatarUrl ?? registeredUser?.avatarUrl ?? null,
    };
  }

  async updateSession(
    id: string,
    data: { displayName?: string; avatarSeed?: string; avatarUrl?: string | null },
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      select: { registeredUserId: true },
    });

    const sessionData: Record<string, unknown> = { ...data };
    const userData: Record<string, unknown> = {};
    if (data.displayName !== undefined) userData.displayName = data.displayName;
    if (data.avatarUrl !== undefined) userData.avatarUrl = data.avatarUrl;

    if (session?.registeredUserId && Object.keys(userData).length > 0) {
      await this.prisma.$transaction([
        this.prisma.session.update({
          where: { id },
          data: sessionData,
        }),
        this.prisma.registeredUser.update({
          where: { id: session!.registeredUserId! },
          data: userData,
        }),
      ]);
      return this.prisma.session.findUniqueOrThrow({ where: { id } });
    }

    return this.prisma.session.update({
      where: { id },
      data: sessionData,
    });
  }

  async findByToken(token: string) {
    return this.prisma.session.findUnique({
      where: { id: token },
    });
  }
}
