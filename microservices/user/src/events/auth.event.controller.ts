import { Controller } from '@nestjs/common';
import { Ctx, RmqContext } from '@nestjs/microservices';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../services/user.service';
import { AuthTokenPayload } from 'src/dto/auth.dto';
import { UserDto } from 'src/dto/user.dto';

type ValidateTokenRequest = {
  token: string;
};

type ValidateTokenResponse = {
  isValid: boolean;
  user?: UserDto;
  error?: string;
};

@Controller()
export class AuthEventController {
  constructor(
    private readonly jwtService: JwtService,
    private readonly service: UserService,
  ) {}

  @MessagePattern('validate_token')
  async handleValidateToken(
    @Payload() data: ValidateTokenRequest,
    @Ctx() context: RmqContext,
  ): Promise<ValidateTokenResponse> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    let response: ValidateTokenResponse;
    const token = data?.token;
    console.log('token from auth.validate-token', token);
    if (!token) {
      response = { isValid: false, error: 'missing_token' };
      channel.ack(originalMsg);
      return response;
    }
    try {
      const payload =
        await this.jwtService.verifyAsync<AuthTokenPayload>(token);
      if (!payload?.email) {
        response = { isValid: false, error: 'invalid_payload' };
        channel.ack(originalMsg);
        return response;
      }
      const user = await this.service.findByEmail(payload.email);
      if (!user[0]) {
        response = { isValid: false, error: 'user_not_found' };
        channel.ack(originalMsg);
        return response;
      }
      response = {
        isValid: true,
        user: { id: user[0].id, email: user[0].email },
      };
      channel.ack(originalMsg);
      return response;
    } catch {
      response = { isValid: false, error: 'invalid_token' };
      channel.ack(originalMsg);
      return response;
    }
  }
}
