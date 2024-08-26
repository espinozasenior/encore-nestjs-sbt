import { Injectable, type OnModuleInit } from "@nestjs/common";
import {
  type cats as CatsModel,
  type Prisma,
  PrismaClient,
} from "@prisma/client";

@Injectable()
export class CatsService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Note: this is optional
    await this.$connect();
  }

  async create(createCatDto: Prisma.catsCreateInput): Promise<void> {
    await this.cats.create({
      data: createCatDto,
    });
    return;
  }

  async get(id: number): Promise<CatsModel | null> {
    return this.cats.findUnique({
      where: {
        id,
      },
    });
  }

  async findAll(): Promise<CatsModel[]> {
    return await this.cats.findMany();
  }
}
