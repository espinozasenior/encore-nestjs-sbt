import { NestFactory } from "@nestjs/core";

import { OrganizationsService } from "./organizations/organizations.service";
import { OrganizationsModule } from "./organizations/organizations.module";
import { PeruConnectService } from "./peru-connect/peru-connect.service";
import { PeruConnectModule } from "./peru-connect/peru-connect.module";
import { AppModule } from "./app.module";
import { CatsModule } from "./cats/cats.module";
import { CatsService } from "./cats/cats.service";

// Mounting the application as bare Nest standalone application so that we can use
// the Nest services inside our Encore endpoints
const applicationContext = NestFactory.createApplicationContext(AppModule).then(
  (app) => {
    return {
      catsService: app.select(CatsModule).get(CatsService, { strict: true }),
      peruConnectService: app
        .select(PeruConnectModule)
        .get(PeruConnectService, { strict: true }),
      organizationsService: app
        .select(OrganizationsModule)
        .get(OrganizationsService),
    };
  },
);

export default applicationContext;
