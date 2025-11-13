import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDto } from 'src/dto/user.dto';

export const CurrentUser = createParamDecorator(
  (data: keyof UserDto | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: UserDto }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
