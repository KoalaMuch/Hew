import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { SessionGuard } from "../../common/session.guard";
import { SessionId } from "../../common/session.decorator";
import { ChatService } from "./chat.service";
import {
  createChatRoomSchema,
  type CreateChatRoomInput,
} from "@hew/shared";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get("rooms")
  @UseGuards(SessionGuard)
  async getRooms(@SessionId() sessionId: string) {
    return this.chatService.getRooms(sessionId);
  }

  @Get("rooms/:id/messages")
  @UseGuards(SessionGuard)
  async getMessages(
    @Param("id") roomId: string,
    @SessionId() sessionId: string,
    @Query("before") before?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const pagination = {
      before,
      page: page !== undefined ? parseInt(page, 10) : undefined,
      limit: limit !== undefined ? parseInt(limit, 10) : undefined,
    };
    return this.chatService.getMessages(roomId, sessionId, pagination);
  }

  @Post("rooms")
  @UseGuards(SessionGuard)
  async createRoom(
    @SessionId() sessionId: string,
    @Body() body: CreateChatRoomInput,
  ) {
    const data = createChatRoomSchema.parse(body);
    return this.chatService.createRoom(sessionId, data);
  }

  @Get("unread-count")
  @UseGuards(SessionGuard)
  async getUnreadCount(@SessionId() sessionId: string) {
    const count = await this.chatService.getUnreadCount(sessionId);
    return { count };
  }

  @Post("rooms/:id/mark-read")
  @UseGuards(SessionGuard)
  async markRoomAsRead(@Param("id") roomId: string, @SessionId() sessionId: string) {
    await this.chatService.markAsRead(roomId, sessionId);
    return { success: true };
  }
}
