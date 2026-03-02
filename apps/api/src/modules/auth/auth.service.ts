import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import * as bcrypt from "bcryptjs";
import type { RegisterInput, LoginInput } from "@hew/shared";

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

    const existingSession = await this.prisma.session.findFirst({
      where: { registeredUserId: user.id },
    });

    if (existingSession) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          registeredUserId: user.id,
          displayName: user.displayName,
        },
      });
    } else {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          registeredUserId: user.id,
          displayName: user.displayName,
        },
      });
    }

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
      isRegistered: !!session.registeredUser,
      user: session.registeredUser,
    };
  }

  async logout(sessionId: string) {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { registeredUserId: null },
    });
  }
}
