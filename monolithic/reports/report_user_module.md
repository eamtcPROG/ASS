## User Module Report

### Overview
The `@user` module provides user registration, authentication (JWT), and basic user listing. It follows NestJS best practices with clear separation of concerns across controller, services, DTOs, guards, strategy, and persistence (TypeORM entity/repository).

### Architecture
- **Module wiring**: Registers the `User` entity repository, configures `JwtModule` dynamically from configuration, and exposes controller and providers.

```11:28:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/user.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: config.get<number>('jwt.expires_in'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [UserService, AuthService, JwtStrategy],
})
export class UserModule {}
```

- **Entity and persistence**: A minimal `User` entity with `id`, `email`, and hashed `password` persisted via TypeORM repository in `UserService`.

```3:12:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/models/user.model.ts
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;
}
```

```9:31:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/services/user.service.ts
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

  async getList(page: number, onPage: number): Promise<ListDto<UserDto>> {
    const [users, total] = await this.repo.findAndCount({
      skip: (page - 1) * onPage,
      take: onPage,
    });
    const objects = users.map((user) => UserDto.fromEntity(user));
    return new ListDto<UserDto>(objects, total, onPage);
  }
}
```

- **DTOs and API contracts**: Small DTOs model input and output; `AuthDto` wraps the access token and the user object.

```4:13:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/dto/auth.dto.ts
export class AuthDto {
  @ApiProperty({ description: 'The access token', example: '1234567890' })
  access_token: string;
  @ApiProperty({ description: 'The user', type: UserDto })
  user: UserDto;
  constructor(access_token: string, user: UserDto) {
    this.user = user;
    this.access_token = access_token;
  }
}
```

```4:26:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/dto/user.dto.ts
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
```

- **Authentication and authorization**:
  - `AuthService` handles password hashing, validation, and JWT issuance using `JwtService`.
  - `JwtStrategy` configures the passport-jwt strategy with secret from config and validates by returning the token payload.
  - `JwtGuard` protects routes; honors a `@Public()` decorator via metadata.
  - `CurrentUser` decorator extracts the `currentUser` from the request for controller handlers.
  - `CurrentUserInterceptor` resolves the authenticated user from the JWT and attaches it to `request.currentUser` for downstream access.

```32:46:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/services/auth.service.ts
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

  const result = UserDto.fromEntity(user);
  return await this.signToken(result);
}
```

```69:76:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/services/auth.service.ts
async signToken(user: UserDto): Promise<AuthDto> {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
  };
  const access_token = await this.jwtService.signAsync(payload);
  return new AuthDto(access_token, user);
}
```

```8:15:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/strategies/jwt.strategy.ts
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('Missing jwt.secret in configuration');
    }
```

```29:39:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/strategies/jwt.strategy.ts
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
```

```5:19:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/guards/jwt.guard.ts
@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  canActivate(
    context: ExecutionContext,
  ): Promise<boolean> | boolean | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

```1:3:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
```

- Current user decorator and interceptor:

```13:18:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Express.Request>();
    return request.currentUser as User;
  },
);
```

```10:22:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/interceptors/current-user.interceptor.ts
@Injectable()
export class CurrentUserInterceptor implements NestInterceptor {
  constructor(private service: AuthService) {}

  async intercept(context: ExecutionContext, handler: CallHandler) {
    const request = context.switchToHttp().getRequest<Express.Request>();
    const token = getJwtFromRequest(request);
    if (!token) return handler.handle();
    const user = await this.service.getUserFromToken(token);
    if (!user) return handler.handle();
    request.currentUser = user;
    return handler.handle();
  }
}
```

- **Controller and endpoints**: Public endpoints for sign-up/sign-in; protected listing with `JwtGuard`. All routes are annotated for Swagger.

```37:55:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/controllers/user.controller.ts
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
```

```56:73:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/controllers/user.controller.ts
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
```

```75:86:/Users/mihaicoretchi/repos/ASS/monolithic/market/src/user/controllers/user.controller.ts
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
```

### Request Flows
- **Sign-up**:
  1. Controller validates presence of `email` and `password`.
  2. `AuthService.signUp` checks for existing user, hashes password with bcrypt, creates user via `UserService`, maps to `UserDto`, issues JWT with payload `{ sub, email }`, returns `AuthDto`.

- **Sign-in**:
  1. Controller validates presence of `email` and `password`.
  2. `AuthService.validate` loads user by email, compares password with stored hash, maps to `UserDto`, issues JWT, returns `AuthDto`.

- **Protected listing**:
  1. `JwtGuard` ensures a valid Bearer token unless route is marked `@Public()`.
  2. `UserService.getList` returns a paginated list of `UserDto` objects.

### Security Considerations
- Passwords are hashed using bcrypt with a generated salt.
- JWT payload is minimal (`sub`, `email`), signed with secret from configuration; expiration is also configured.
- `JwtGuard` respects `@Public()` metadata for opt-out on specific routes.
- Emails are normalized to lowercase for uniqueness checks and lookups.

### Architectural Approach
- **Layered design**: Controller -> Auth/User services -> Repository/Entity; DTOs strictly separate API contracts from persistence.
- **Config-driven JWT**: `JwtModule.registerAsync` ensures secrets and expirations are injected from environment/config.
- **Composability & extensibility**: Guard + decorator pattern allows flexible protection; adding roles/permissions or refresh tokens can build on this foundation without changing controller signatures.


