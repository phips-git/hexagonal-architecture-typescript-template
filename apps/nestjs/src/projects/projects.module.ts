import { Global, Module } from '@nestjs/common';
import {
  DATABASE_CLIENT,
  DatabaseService
} from '../infrastructure/database.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Global()
@Module({
  controllers: [ProjectsController],
  providers: [
    DatabaseService,
    ProjectsService,
    {
      provide: DATABASE_CLIENT,
      useFactory: (dbService: DatabaseService) => dbService,
      inject: [DatabaseService]
    }
  ],
  exports: [ProjectsService, DatabaseService]
})
export class ProjectsModule {}
