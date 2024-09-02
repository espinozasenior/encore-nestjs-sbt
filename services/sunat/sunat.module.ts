import { Module } from "@nestjs/common";

import { PeruConnectService } from "./sunat.service";

@Module({
  providers: [PeruConnectService],
})
export class PeruConnectModule {}
