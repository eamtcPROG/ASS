import { ApiProperty } from '@nestjs/swagger';
import { User } from '../models/user.model';

export class UserDto {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the user',
    type: 'number',
  })
  id: number;

  @ApiProperty({
    example: 'examplde@example.com',
    description: 'User email - unique in system',
    type: 'string',
  })
  email: string;

  constructor(id: number, email: string) {
    this.id = id;
    this.email = email;
  }

  static fromEntity(entity: User): UserDto {
    return new UserDto(entity.id, entity.email);
  }
}
