import { Global, Module } from '@nestjs/common';
import {
  DatabaseService,
  TASKS_DATABASE_CLIENT
} from '../infrastructure/database.service';
import { OutputMappingService } from '../infrastructure/output-mapping.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

export { TASKS_DATABASE_CLIENT };

@Global()
@Module({
  controllers: [TasksController],
  providers: [DatabaseService, TasksService, OutputMappingService],
  exports: [TasksService]
})
export class TasksModule {}
