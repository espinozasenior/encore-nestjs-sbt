import { Module } from "@nestjs/common";

import { BankingService } from "./banking.service";

@Module({
  providers: [BankingService],
})
export class BankingModule {}
