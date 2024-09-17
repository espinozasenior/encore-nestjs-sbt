import { Module } from "@nestjs/common";
import { OrganizationsModule } from "./organizations/organizations.module";
import { SunatModule } from "./sunat/sunat.module";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { SecurityModule } from "./security/security.module";
import { PrometeoModule } from "./prometeo/prometeo.module";

@Module({
  imports: [
    OrganizationsModule,
    PrometeoModule,
    SecurityModule,
    SunatModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
