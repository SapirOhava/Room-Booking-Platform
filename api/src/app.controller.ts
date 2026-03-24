import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Basic hello endpoint' })
  @ApiOkResponse({ description: 'Returns hello message' })
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
