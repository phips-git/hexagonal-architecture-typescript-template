import { GetAuthenticatedUserUsecase } from '@hexagonal-ts-template/auth/application';
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env', '.env.local']
    })
  ],
  providers: [
    DatabaseService,
    {
      provide: 'getAuthenticatedUserUsecase',
      useFactory: (databaseService: DatabaseService) =>
        new GetAuthenticatedUserUsecase(
          {
            generateId: () => '',
            loggerFactory: () =>
              import('@hexagonal-ts-template/common/infrastructure').then(
                (mod) => mod.createConsoleLogger('App')
              )
          },
          databaseService.getPersistencePorts().userPersistence
        ),
      inject: [DatabaseService]
    }
  ],
  exports: [ConfigModule, DatabaseService, 'getAuthenticatedUserUsecase']
})
export class ConfigDatabaseModule {}
