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
    return this.prisma.session.findUnique({
      where: { id },
    });
  }

  async updateSession(
    id: string,
    data: { displayName?: string; avatarSeed?: string },
  ) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      select: { registeredUserId: true },
    });

    if (session?.registeredUserId && data.displayName !== undefined) {
      await this.prisma.$transaction([
        this.prisma.session.update({
          where: { id },
          data,
        }),
        this.prisma.registeredUser.update({
          where: { id: session.registeredUserId },
          data: { displayName: data.displayName },
        }),
      ]);
      return this.prisma.session.findUniqueOrThrow({ where: { id } });
    }

    return this.prisma.session.update({
      where: { id },
      data,
    });
  }

  async findByToken(token: string) {
    return this.prisma.session.findUnique({
      where: { id: token },
    });
  }
}
