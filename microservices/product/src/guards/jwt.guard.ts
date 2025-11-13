import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthClient } from '../clients/auth.client';
import { UserDto } from 'src/dto/user.dto';
import { getJwtFromRequest } from 'src/tools/common.tools';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly authClient: AuthClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req: { headers?: Record<string, string>; user?: UserDto } = context
      .switchToHttp()
      .getRequest();
    const token = getJwtFromRequest(req);
    if (!token) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const result = await this.authClient.validateToken(token);
    if (!result.isValid || !result.user) {
      throw new UnauthorizedException('Invalid token');
    }
    req.user = result.user;
    return true;
  }
}
