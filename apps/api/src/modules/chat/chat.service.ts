import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MessageType } from "@hew/db";
import { PrismaService } from "../../common/prisma.service";
import type { CreateChatRoomInput } from "@hew/shared";

export interface PaginationOptions {
  before?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(sessionId: string, data: CreateChatRoomInput) {
    const participants = [sessionId, data.participantSessionId];
    return this.prisma.chatRoom.create({
      data: {
        tripId: data.tripId ?? undefined,
        itemRequestId: data.itemRequestId ?? undefined,
        participants,
      },
    });
  }

  async getRooms(sessionId: string) {
    return this.prisma.chatRoom.findMany({
      where: {
        participants: { has: sessionId },
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async getMessages(
    roomId: string,
    sessionId: string,
    pagination: PaginationOptions,
  ) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    if (!room.participants.includes(sessionId)) {
      throw new ForbiddenException("You are not a participant of this room");
    }

    const limit = Math.min(pagination.limit ?? 50, 100);
    const skip = pagination.page !== undefined ? pagination.page * limit : 0;

    const where: { roomId: string; id?: { lt: string } } = { roomId };

    if (pagination.before) {
      where.id = { lt: pagination.before };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      take: limit,
      skip: pagination.before ? 0 : skip,
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarSeed: true },
        },
      },
    });

    return messages.reverse();
  }

  async sendMessage(
    roomId: string,
    senderId: string,
    data: { content: string; imageUrl?: string; type?: MessageType },
  ) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    if (!room.participants.includes(senderId)) {
      throw new ForbiddenException("You are not a participant of this room");
    }

    return this.prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content: data.content,
        imageUrl: data.imageUrl,
        type: data.type ?? MessageType.TEXT,
      },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarSeed: true },
        },
      },
    });
  }
}
