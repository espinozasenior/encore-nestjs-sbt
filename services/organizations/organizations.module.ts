import { Module } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";

@Module({
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
