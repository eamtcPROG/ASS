import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.model';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  create(object: CreateUserDto) {
    object.email = object.email.toLowerCase();
    const user = this.repo.create(object);
    return this.repo.save(user);
  }

  findByEmail(email: string) {
    return this.repo.find({ where: { email: email.toLowerCase() } });
  }
}
