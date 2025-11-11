import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthService } from '../services/auth.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { UserService } from '../services/user.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ResultObjectDto } from '../dto/resultobject.dto';
import { UserDto } from '../dto/user.dto';
import { ResultListDto } from '../dto/resultlist.dto';
import { JwtGuard } from '../guards/jwt.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiConsumes('application/json')
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({
    type: ResultObjectDto<UserDto>,
    description: 'User created',
  })
  @ApiNotFoundResponse({
    type: ResultObjectDto<null>,
    description: 'User not found',
  })
  @Post('/sign-up')
  signUp(@Body() body: CreateUserDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.authService.signUp(body);
  }

  @ApiOperation({ summary: 'Sign in a user' })
  @ApiConsumes('application/json')
  @ApiBody({ type: SignInDto })
  @ApiOkResponse({
    type: ResultObjectDto<UserDto>,
    description: 'User signed in',
  })
  @ApiBadRequestResponse({
    type: ResultObjectDto<null>,
    description: 'Invalid credentials',
  })
  @Post('/sign-in')
  signIn(@Body() body: SignInDto) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email and password are required');
    }
    return this.authService.signIn(body);
  }

  @ApiOperation({ summary: 'Get a list of users' })
  @ApiConsumes('application/json')
  @ApiOkResponse({
    type: ResultListDto<UserDto>,
    description: 'List of users',
  })
  @ApiBearerAuth('jwt')
  @UseGuards(JwtGuard)
  @Get('/')
  getList() {
    return this.userService.getList(1, 10);
  }
}
