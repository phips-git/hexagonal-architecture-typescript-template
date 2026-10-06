import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigDatabaseModule } from './infrastructure/config-database.module';
import appConfig from './infrastructure/config/app.config';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    ConfigDatabaseModule,
    ProjectsModule,
    TasksModule
  ]
})
export class AppModule {}
