import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../models/user.model';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      headers?: Record<string, string>;
      currentUser?: User;
    }
  }
}
export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Express.Request>();
    return request.currentUser as User;
  },
);
