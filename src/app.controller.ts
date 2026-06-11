import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Health check: GET /api/v1/health */
  @SkipThrottle()
  @Get('health')
  health(): { status: string; service: string } {
    return this.appService.health();
  }
}
