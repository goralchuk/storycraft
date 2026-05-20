import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { Env } from '../config/env.schema';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './strategies/jwt.strategy';
import type { GoogleUser } from './strategies/google.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('stub-login')
  stubLogin() {
    return this.auth.stubLogin();
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google — no body needed
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: Request, @Res() res: Response) {
    const result = this.auth.googleLogin(req.user as GoogleUser);
    const frontendUrl = this.config.get('FRONTEND_URL', { infer: true });
    res.redirect(`${frontendUrl}/auth/callback?token=${result.access_token}`);
  }

  // Called server-side by NextAuth after Google OAuth completes on the frontend
  @Post('google/token')
  googleToken(@Body() dto: { googleId: string; email: string; name: string }) {
    return this.auth.googleVerify(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
