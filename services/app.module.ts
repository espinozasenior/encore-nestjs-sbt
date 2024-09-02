import { Module } from "@nestjs/common";
import { OrganizationsModule } from "./organizations/organizations.module";
import { PeruConnectModule } from "./sunat/sunat.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { SecurityModule } from "./security/security.module";

@Module({
  imports: [
    OrganizationsModule,
    PeruConnectModule,
    SecurityModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
