import { Module } from "@nestjs/common";

import { SunatService } from "./sunat.service";

@Module({
  providers: [SunatService],
})
export class SunatModule {}
