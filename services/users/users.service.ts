import { Injectable, type OnModuleInit } from "@nestjs/common";
import {
  type User as UserModel,
  type Prisma,
  PrismaClient,
} from "./../../prisma/generated/psql-client";

import { APIError } from "encore.dev/api";

@Injectable()
export class UsersService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async create(createUserDto: Prisma.UserCreateInput): Promise<UserModel> {
    return await this.user.create({
      data: createUserDto,
    });
  }

  async findByClerkId(clerkId: string): Promise<UserModel | null> {
    return this.user.findUnique({
      where: { clerkId },
    });
  }

  async update(
    userId: number,
    input: Prisma.UserUpdateInput,
  ): Promise<UserModel> {
    if (input.acceptTermsAndPrivacyPolicy !== undefined) {
      throw APIError.invalidArgument(
        "You cannot modify the agreed terms or the privacy policy.",
      );
    }

    if (input.acknowledgesLegalRepresentation !== undefined) {
      throw APIError.invalidArgument(
        "You cannot modify an acknowledged legal representation.",
      );
    }

    const data: Prisma.UserUpdateInput = {};

    if (input.onboardedAt !== undefined && input.onboardedAt !== null) {
      data.onboardedAt = input.onboardedAt;
    }

    return await this.user.update({
      where: { id: userId },
      data,
    });
  }

  async resolveIdByClerkId(clerkId: string): Promise<number> {
    const result = await this.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!result) {
      throw new Error("User not found");
    }
    return result.id;
  }

  async existsById(userId: number): Promise<boolean> {
    return (await this.user.count({ where: { id: userId } })) > 0;
  }

  async existsByClerkId(clerkId: string): Promise<boolean> {
    return (
      (await this.user.count({
        where: { clerkId },
      })) > 0
    );
  }
}
