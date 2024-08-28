import { Injectable, type OnModuleInit } from "@nestjs/common";
import {
  type Organization as OrganizationModel,
  type Prisma,
  PrismaClient,
} from "@prisma/client";
import { APIError } from "encore.dev/api";

@Injectable()
export class OrganizationsService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async create(
    inputs: Prisma.OrganizationCreateInput,
  ): Promise<OrganizationModel> {
    if (await this.existsByRuc(inputs.ruc)) {
      throw APIError.alreadyExists(
        "organization with specified ruc already exists",
      );
    }

    return await this.organization.create({
      data: inputs,
    });
  }

  async existsByRuc(ruc: string): Promise<boolean> {
    const count = await this.organization.count({
      where: { ruc },
    });

    return count > 0;
  }
}
