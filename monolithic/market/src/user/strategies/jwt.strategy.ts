import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthTokenPayload } from '../dto/auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('Missing jwt.secret in configuration');
    }

    const jwtFromRequest = (req?: {
      headers?: Record<string, string>;
    }): string | null => {
      const authHeader = req?.headers?.['authorization'];
      if (typeof authHeader !== 'string') {
        return null;
      }
      const [scheme, token] = authHeader.split(' ');
      if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return null;
      }
      return token;
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      jwtFromRequest: jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: AuthTokenPayload) {
    return payload;
  }
}
