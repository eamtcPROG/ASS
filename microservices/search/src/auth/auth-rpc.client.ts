import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_RMQ } from '../constants/service';
import { firstValueFrom, timeout } from 'rxjs';

export type ValidationResult = {
  isValid: boolean;
  user?: { id: number; email: string };
  error?: string;
};

@Injectable()
export class AuthRpcClient {
  private cache = new Map<string, { exp: number; value: ValidationResult }>();
  private readonly ttlMs = 30000;

  constructor(@Inject(USER_RMQ) private readonly client: ClientProxy) {}

  async validateToken(token: string): Promise<ValidationResult> {
    const now = Date.now();
    const cached = this.cache.get(token);
    if (cached && cached.exp > now) {
      return cached.value;
    }
    const result = await firstValueFrom(
      this.client
        .send<ValidationResult>('auth.validate-token', { token })
        .pipe(timeout(2000)),
    );
    this.cache.set(token, { exp: now + this.ttlMs, value: result });
    return result;
  }
}


