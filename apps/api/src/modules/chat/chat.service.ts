import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { MessageType } from "@hew/db";
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
    const participants = [sessionId, data.participantSessionId].sort();
    const participantSet = new Set(participants);
    if (participantSet.size !== 2) {
      throw new Error("Cannot create room with self");
    }

    const existing = await this.prisma.chatRoom.findFirst({
      where: {
        participants: { hasEvery: participants },
        ...(data.tripId && { tripId: data.tripId }),
        ...(data.itemRequestId && { itemRequestId: data.itemRequestId }),
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.chatRoom.create({
      data: {
        tripId: data.tripId ?? undefined,
        itemRequestId: data.itemRequestId ?? undefined,
        participants,
      },
    });
  }

  async getRooms(sessionId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        participants: { has: sessionId },
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: {
            sender: {
              select: { id: true, displayName: true, avatarSeed: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get all unique participant IDs
    const allParticipantIds = new Set<string>();
    rooms.forEach((room) => {
      room.participants.forEach((id) => allParticipantIds.add(id));
    });

    // Fetch participant session info
    const participantSessions = await this.prisma.session.findMany({
      where: { id: { in: Array.from(allParticipantIds) } },
      select: { id: true, displayName: true, avatarSeed: true, avatarUrl: true },
    });

    // Create a map for quick lookup
    const sessionMap = new Map(
      participantSessions.map((s) => [s.id, s]),
    );

    // Attach participant sessions to each room
    return rooms.map((room) => ({
      ...room,
      participantSessions: room.participants
        .map((id) => sessionMap.get(id))
        .filter((s): s is NonNullable<typeof s> => s !== undefined),
    }));
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
          select: { id: true, displayName: true, avatarSeed: true, avatarUrl: true },
        },
      },
    });

    // Mark messages as read when user views them
    await this.markAsRead(roomId, sessionId);

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
        type: data.type ?? "TEXT",
      },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarSeed: true, avatarUrl: true },
        },
      },
    });
  }

  async sendOrderCardMessage(
    roomId: string,
    senderId: string,
    order: {
      id: string;
      orderName: string | null;
      orderImageUrl: string | null;
      totalAmount: { toString(): string };
      status: string;
      buyerSessionId: string;
      shipment?: { trackingNumber: string | null; carrier: string | null } | null;
    },
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

    const content = JSON.stringify({
      orderId: order.id,
      orderName: order.orderName,
      orderImageUrl: order.orderImageUrl,
      totalAmount: Number(order.totalAmount),
      status: order.status,
      buyerSessionId: order.buyerSessionId,
      trackingNumber: order.shipment?.trackingNumber ?? null,
      carrier: order.shipment?.carrier ?? null,
    });

    return this.prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content,
        type: "ORDER_CARD",
      },
      include: {
        sender: {
          select: { id: true, displayName: true, avatarSeed: true, avatarUrl: true },
        },
      },
    });
  }

  async markAsRead(roomId: string, sessionId: string) {
    const room = await this.prisma.chatRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException("Room not found");
    }

    if (!room.participants.includes(sessionId)) {
      throw new ForbiddenException("You are not a participant of this room");
    }

    // Mark all unread messages from other participants as read
    await this.prisma.chatMessage.updateMany({
      where: {
        roomId,
        senderId: { not: sessionId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }

  async getUnreadCount(sessionId: string): Promise<number> {
    // Get all rooms where user is a participant
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        participants: { has: sessionId },
      },
      select: { id: true },
    });

    if (rooms.length === 0) {
      return 0;
    }

    // Count unread messages (messages from others that haven't been read)
    const count = await this.prisma.chatMessage.count({
      where: {
        roomId: { in: rooms.map((r) => r.id) },
        senderId: { not: sessionId },
        readAt: null,
      },
    });

    return count;
  }
}
