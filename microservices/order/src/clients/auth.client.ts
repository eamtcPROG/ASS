import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { USER_RMQ } from '../constants/service';
import { firstValueFrom, timeout } from 'rxjs';

export type ValidationResult = {
  isValid: boolean;
  user?: { id: number; email: string };
  error?: string;
};

@Injectable()
export class AuthClient implements OnModuleInit, OnModuleDestroy {
  private cache = new Map<string, { exp: number; value: ValidationResult }>();
  private readonly ttlMs = 30000;

  constructor(@Inject(USER_RMQ) private readonly client: ClientProxy) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  onModuleDestroy(): void {
    this.client.close();
  }

  async validateToken(token: string): Promise<ValidationResult> {
    const now = Date.now();
    const cached = this.cache.get(token);
    if (cached && cached.exp > now) {
      return cached.value;
    }

    try {
      const result = await firstValueFrom(
        this.client
          .send<ValidationResult>('validate_token', { token })
          .pipe(timeout(5000)),
      );

      this.cache.set(token, { exp: now + this.ttlMs, value: result });
      return result;
    } catch (err) {
      console.error('Auth RPC validateToken error:', err);
      throw err;
    }
  }
}
