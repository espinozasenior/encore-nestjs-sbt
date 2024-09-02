import { NestFactory } from "@nestjs/core";

import { OrganizationsService } from "./organizations/organizations.service";
import { OrganizationsModule } from "./organizations/organizations.module";
import { SecurityService } from "./security/security.service";
import { SecurityModule } from "./security/security.module";
import { SunatService } from "./sunat/sunat.service";
import { SunatModule } from "./sunat/sunat.module";
import { UsersService } from "./users/users.service";
import { UsersModule } from "./users/users.module";
import { AuthService } from "./auth/auth.service";
import { AuthModule } from "./auth/auth.module";
import { AppModule } from "./app.module";

// Mounting the application as bare Nest standalone application so that we can use
// the Nest services inside our Encore endpoints
const applicationContext = NestFactory.createApplicationContext(AppModule).then(
  (app) => {
    return {
      sunatService: app.select(SunatModule).get(SunatService, { strict: true }),
      usersService: app.select(UsersModule).get(UsersService, {
        strict: true,
      }),
      authService: app.select(AuthModule).get(AuthService, { strict: true }),
      organizationsService: app
        .select(OrganizationsModule)
        .get(OrganizationsService),
      paymentsService: app
        .select(UsersModule)
        .get(UsersService, { strict: true }),
      securityService: app.select(SecurityModule).get(SecurityService, {
        strict: true,
      }),
    };
  },
);

export default applicationContext;
