import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthRpcClient } from './auth-rpc.client';

function getJwtFromRequest(req?: { headers?: Record<string, string> }) {
  const authHeader = req?.headers?.['authorization'];
  if (typeof authHeader !== 'string') {
    return null;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token;
}

@Injectable()
export class JwtIntrospectionGuard implements CanActivate {
  constructor(private readonly authClient: AuthRpcClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
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


