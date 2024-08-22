import { NestFactory } from "@nestjs/core";
import { PeruConnectService } from "./peru-connect/peru-connect.service";
import { PeruConnectModule } from "./peru-connect/peru-connect.module";
import { AppModule } from "./app.module";
import { CatsModule } from "./cats/cats.module";
import { CatsService } from "./cats/cats.repository";

// Mounting the application as bare Nest standalone application so that we can use
// the Nest services inside our Encore endpoints
const applicationContext = NestFactory.createApplicationContext(AppModule).then(
  (app) => {
    return {
      catsService: app.select(CatsModule).get(CatsService, { strict: true }),
      peruConnectService: app
        .select(PeruConnectModule)
        .get(PeruConnectService, { strict: true }),
    };
  },
);

export default applicationContext;
