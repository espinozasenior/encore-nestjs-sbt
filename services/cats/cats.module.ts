import { Module } from "@nestjs/common";
import { catsProviders } from "./cats.providers";
import { CatsService } from "./cats.repository";
import { DatabaseModule } from "./core/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [CatsService, ...catsProviders],
})
export class CatsModule {}
