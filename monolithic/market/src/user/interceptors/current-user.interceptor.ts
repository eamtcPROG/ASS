import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { getJwtFromRequest } from 'src/app/tools/common.tools';
import { AuthService } from '../services/auth.service';

@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private service: AuthService) {}

  async intercept(context: ExecutionContext, handler: CallHandler) {
    const request = context.switchToHttp().getRequest<Express.Request>();
    const token = getJwtFromRequest(request);
    if (!token) return handler.handle();
    const user = await this.service.getUserFromToken(token);
    if (!user) return handler.handle();
    request.currentUser = user;
    return handler.handle();
  }
}
