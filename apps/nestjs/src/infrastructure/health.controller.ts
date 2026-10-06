import {
  Controller,
  Get,
  HealthCheck,
  HealthCheckService,
  SqliteHealthIndicator
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly sqlite: SqliteHealthIndicator
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([() => ({ health: 'ok' })]);
  }
}
