import { Module } from "@nestjs/common";
import { OrganizationsModule } from "./organizations/organizations.module";
import { PeruConnectModule } from "./peru-connect/peru-connect.module";
import { UsersModule } from "./users/users.module";
import { CatsModule } from "./cats/cats.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [
    OrganizationsModule,
    PeruConnectModule,
    UsersModule,
    CatsModule,
    AuthModule,
  ],
})
export class AppModule {}
