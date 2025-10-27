import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserService } from './user.service';
import * as bcrypt from 'bcrypt';
import { SignInDto } from '../dto/sign-in.dto';
import { UserDto } from '../dto/user.dto';
@Injectable()
export class AuthService {
  constructor(private readonly service: UserService) {}

  async hashPassword(password: string): Promise<string> {
    const salt: string = await bcrypt.genSalt();
    const hash: string = await bcrypt.hash(password, salt);
    return hash;
  }

  async isCorrectPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
  async signUp(object: CreateUserDto) {
    const existingUser = await this.service.findByEmail(object.email);
    if (existingUser.length > 0) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await this.hashPassword(object.password);
    const user = await this.service.create({
      ...object,
      password: hashedPassword,
    });

    return UserDto.fromEntity(user);
  }

  async signIn(object: SignInDto) {
    const user = await this.service.findByEmail(object.email);
    if (user.length === 0) {
      throw new BadRequestException('Invalid credentials');
    }

    const match: boolean = await this.isCorrectPassword(
      object.password,
      user[0].password,
    );
    if (!match) {
      throw new BadRequestException('Invalid credentials');
    }
    return UserDto.fromEntity(user[0]);
  }
}
