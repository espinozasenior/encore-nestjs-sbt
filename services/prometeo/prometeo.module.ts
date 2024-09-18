import { Module } from "@nestjs/common";

import { PrometeoService } from "./prometeo.service";

@Module({
  providers: [PrometeoService],
})
export class PrometeoModule {}
