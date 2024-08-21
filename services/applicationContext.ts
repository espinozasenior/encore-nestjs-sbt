import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { CatsModule } from "./cats/cats.module";
import { CatsService } from "./cats/cats.repository";

// Mounting the application as bare Nest standalone application so that we can use
// the Nest services inside our Encore endpoints
const applicationContext: Promise<{ catsService: CatsService }> =
  NestFactory.createApplicationContext(AppModule).then((app) => {
    return {
      catsService: app.select(CatsModule).get(CatsService, { strict: true }),
    };
  });

export default applicationContext;
