import { Module } from "@nestjs/common";

import { PeruConnectService } from "./peru-connect.service";

@Module({
  providers: [PeruConnectService],
})
export class PeruConnectModule {}
