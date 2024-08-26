import { Module } from "@nestjs/common";
import { CatsModule } from "./cats/cats.module";
import { PeruConnectModule } from "./peru-connect/peru-connect.module";

@Module({
  imports: [CatsModule, PeruConnectModule],
})
export class AppModule {}
