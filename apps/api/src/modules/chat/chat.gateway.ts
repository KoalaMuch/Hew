import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma.service";
import { ChatService } from "./chat.service";
import { SESSION_TOKEN_HEADER } from "@hew/shared";
import type { MessageType } from "@hew/db";

interface AuthenticatedSocket {
  id: string;
  sessionId?: string;
  handshake: { auth?: { token?: string }; headers?: Record<string, string> };
  join(room: string): void;
  to(room: string): { emit(event: string, data: unknown): void };
}

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/chat",
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly sessionToSocketId = new Map<string, Set<string>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const auth = client.handshake?.auth;
    const headers = client.handshake?.headers;
    const token =
      auth?.token ?? headers?.[SESSION_TOKEN_HEADER];

    if (!token) {
      this.logger.warn(`Client ${client.id} connected without session token`);
      return;
    }

    const session = await this.prisma.session.findUnique({
      where: { id: token },
    });

    if (!session) {
      this.logger.warn(`Client ${client.id} has invalid session token`);
      return;
    }

    const set = this.sessionToSocketId.get(session.id) ?? new Set();
    set.add(client.id);
    this.sessionToSocketId.set(session.id, set);
    (client as AuthenticatedSocket).sessionId = session.id;
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const sessionId = client.sessionId;
    if (sessionId) {
      const set = this.sessionToSocketId.get(sessionId);
      if (set) {
        set.delete(client.id);
        if (set.size === 0) {
          this.sessionToSocketId.delete(sessionId);
        }
      }
    }
  }

  @SubscribeMessage("join_room")
  handleJoinRoom(client: AuthenticatedSocket, payload: { roomId: string }) {
    if (payload?.roomId) {
      client.join(`room:${payload.roomId}`);
    }
  }

  @SubscribeMessage("send_message")
  async handleSendMessage(
    client: AuthenticatedSocket,
    payload: { roomId: string; content: string; imageUrl?: string; type?: MessageType },
  ) {
    const sessionId = client.sessionId;
    if (!sessionId || !payload?.roomId || !payload?.content) {
      return;
    }

    try {
      const message = await this.chatService.sendMessage(
        payload.roomId,
        sessionId,
        {
          content: payload.content,
          imageUrl: payload.imageUrl,
          type: payload.type,
        },
      );
      this.server.to(`room:${payload.roomId}`).emit("message", message);
    } catch (err) {
      this.logger.error("Failed to send message", err);
    }
  }

  @SubscribeMessage("typing")
  handleTyping(client: AuthenticatedSocket, payload: { roomId: string }) {
    const sessionId = client.sessionId;
    if (sessionId && payload?.roomId) {
      client.to(`room:${payload.roomId}`).emit("typing", { sessionId });
    }
  }
}
