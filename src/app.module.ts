import { Module } from '@nestjs/common';
import { BoatModule } from '@libs/boat';
import { ObjectionModule, DatabaseOptions } from '@squareboat/nestjs-objection';
import { LocalizationModule } from '@squareboat/nestjs-localization';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CatsModule } from './cats/cats.module';

@Module({
  imports: [
    ObjectionModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => {
        return config.get('db');
      },
      inject: [ConfigService],
    }),
    LocalizationModule.register({
      path: 'resources/lang',
      fallbackLang: 'en',
    }),
    BoatModule,
    CatsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}