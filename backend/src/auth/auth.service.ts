import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

const STUB_USER = {
  id: 'stub-user-id',
  email: 'test@storycraft.local',
  name: 'Test User',
};

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}

  stubLogin() {
    const token = this.jwt.sign({ sub: STUB_USER.id, email: STUB_USER.email });
    return { access_token: token, user: STUB_USER };
  }
}
