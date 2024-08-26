import { Module } from "@nestjs/common";
import { CatsService } from "./cats.service";

@Module({
  imports: [],
  providers: [CatsService],
})
export class CatsModule {}
