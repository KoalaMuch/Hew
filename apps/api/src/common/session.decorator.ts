import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const SESSION_ID_KEY = "sessionId";

export const SessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request[SESSION_ID_KEY];
  },
);
