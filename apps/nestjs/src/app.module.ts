import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigDatabaseModule } from './infrastructure/config-database.module';
import appConfig from './infrastructure/config/app.config';
import { DatabaseModule } from './infrastructure/database.module';
import { HealthController } from './infrastructure/health.controller';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ConfigDatabaseModule,
    DatabaseModule,
    ProjectsModule,
    TasksModule
  ],
  controllers: [AppController, HealthController],
  providers: [AppService]
})
export class AppModule {}
