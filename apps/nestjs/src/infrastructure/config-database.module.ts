import { GetAuthenticatedUserUsecase } from '@hexagonal-ts-template/auth/application';
import { createConsoleLogger } from '@hexagonal-ts-template/common/infrastructure';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    {
      provide: 'getAuthenticatedUserUsecase',
      useFactory: (databaseService: DatabaseService) =>
        new GetAuthenticatedUserUsecase(
          {
            generateId: () =>
              databaseService.getPersistencePorts().generator.generate(),
            loggerFactory: (name: string) => createConsoleLogger(name)
          },
          databaseService.getPersistencePorts().authenticationPort,
          databaseService.getPersistencePorts().userPersistence
        ),
      inject: [DatabaseService]
    }
  ],
  exports: [DatabaseService, 'getAuthenticatedUserUsecase']
})
export class ConfigDatabaseModule {}
