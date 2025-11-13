import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUserShape = {
  id: number;
  email: string;
};

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserShape | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: CurrentUserShape }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);


