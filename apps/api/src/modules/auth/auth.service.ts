import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import * as bcrypt from "bcryptjs";
import type { RegisterInput, LoginInput } from "@hew/shared";
import type { OAuthProfile } from "./oauth/oauth.types";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(sessionId: string, data: RegisterInput) {
    const existing = await this.prisma.registeredUser.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException("Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.registeredUser.create({
      data: {
        email: data.email,
        passwordHash,
        displayName: data.displayName,
      },
    });

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        registeredUserId: user.id,
        displayName: data.displayName,
      },
    });

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  async login(sessionId: string, data: LoginInput) {
    const user = await this.prisma.registeredUser.findUnique({
      where: { email: data.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    await this.linkSessionToUser(sessionId, user);

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    };
  }

  async getProfile(sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        registeredUser: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
            googleId: true,
            role: true,
            rating: true,
            reviewCount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!session) return null;

    return {
      sessionId: session.id,
      displayName: session.displayName,
      avatarSeed: session.avatarSeed,
      avatarUrl:
        session.avatarUrl ??
        session.registeredUser?.avatarUrl ??
        null,
      isRegistered: !!session.registeredUser,
      user: session.registeredUser,
    };
  }

  async loginWithOAuth(sessionId: string, profile: OAuthProfile) {
    const providerIdField = `${profile.provider}Id` as const;

    const existing = await this.prisma.registeredUser.findFirst({
      where: { [providerIdField]: profile.providerId } as Record<
        string,
        string
      >,
    });

    let user: { id: string; displayName: string; email: string | null };

    if (existing) {
      user = existing;
      if (profile.avatarUrl && !existing.avatarUrl) {
        await this.prisma.registeredUser.update({
          where: { id: existing.id },
          data: { avatarUrl: profile.avatarUrl },
        });
      }
    } else {
      if (profile.email) {
        const byEmail = await this.prisma.registeredUser.findUnique({
          where: { email: profile.email },
        });
        if (byEmail) {
          user = await this.prisma.registeredUser.update({
            where: { id: byEmail.id },
            data: {
              [providerIdField]: profile.providerId,
              avatarUrl: byEmail.avatarUrl || profile.avatarUrl || null,
            },
          });
        } else {
          user = await this.prisma.registeredUser.create({
            data: {
              [providerIdField]: profile.providerId,
              email: profile.email,
              displayName: profile.displayName,
              avatarUrl: profile.avatarUrl || null,
            },
          });
        }
      } else {
        user = await this.prisma.registeredUser.create({
          data: {
            [providerIdField]: profile.providerId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl || null,
          },
        });
      }
    }

    await this.linkSessionToUser(sessionId, user);

    return { id: user.id, displayName: user.displayName };
  }

  /**
   * Disconnect any existing session linked to this user, then link the
   * given session. Shared by login() and loginWithOAuth() to guarantee
   * the unique constraint on registeredUserId is never violated.
   */
  private async linkSessionToUser(
    sessionId: string,
    user: { id: string; displayName: string },
  ) {
    const existingSession = await this.prisma.session.findFirst({
      where: { registeredUserId: user.id },
    });
    if (existingSession && existingSession.id !== sessionId) {
      await this.prisma.session.update({
        where: { id: existingSession.id },
        data: { registeredUserId: null },
      });
    }

    const userWithAvatar = await this.prisma.registeredUser.findUnique({
      where: { id: user.id },
      select: { avatarUrl: true },
    });
    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        registeredUserId: user.id,
        displayName: user.displayName,
        avatarUrl: userWithAvatar?.avatarUrl ?? undefined,
      },
    });
  }

  async logout(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { registeredUserId: null },
    });
  }
}
