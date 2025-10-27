import { BadRequestException, Body, Controller, Post } from '@nestjs/common';

import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { SignInDto } from '../dto/sign-in.dto';

@Controller('user')
export class UserController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  signUp(@Body() body: CreateUserDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.authService.signUp(body);
  }

  @Post('/sign-in')
  signIn(@Body() body: SignInDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.authService.signIn(body);
  }
}
