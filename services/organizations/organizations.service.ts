import { Injectable, type OnModuleInit } from "@nestjs/common";
import {
  type Organization as OrganizationModel,
  OrganizationRole,
  type Prisma,
  PrismaClient,
} from "@prisma/client";
import { APIError } from "encore.dev/api";

@Injectable()
export class OrganizationsService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async getAllForUser(userId: number): Promise<OrganizationModel[]> {
    return await this.organization.findMany({
      where: {
        organizationMembers: {
          some: {
            userId,
          },
        },
      },
    });
  }

  async create(
    userId: number,
    inputs: Prisma.OrganizationCreateInput,
  ): Promise<OrganizationModel> {
    if (await this.existsByRuc(inputs.ruc)) {
      throw APIError.alreadyExists(
        "organization with specified ruc already exists",
      );
    }

    const organization = await this.$transaction(
      async (tx): Promise<OrganizationModel> => {
        const organization = await tx.organization.create({
          data: inputs,
        });

        await tx.organizationMembers.create({
          data: {
            organizationId: organization.id,
            role: OrganizationRole.owner,
            userId: userId,
          },
        });

        return organization;
      },
    );

    return organization;
  }

  async existsByRuc(ruc: string): Promise<boolean> {
    const count = await this.organization.count({
      where: { ruc },
    });

    return count > 0;
  }
}
