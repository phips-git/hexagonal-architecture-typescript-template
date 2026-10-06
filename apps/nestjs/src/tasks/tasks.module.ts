import { Global, Module } from '@nestjs/common';
import { DatabaseService } from '../infrastructure/database.service';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Global()
@Module({
  controllers: [TasksController],
  providers: [DatabaseService, TasksService],
  exports: [TasksService]
})
export class TasksModule {}
