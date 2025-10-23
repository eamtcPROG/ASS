import { Controller, Get } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get()
  getHello(): string {
    return this.service.getHello();
  }
}
