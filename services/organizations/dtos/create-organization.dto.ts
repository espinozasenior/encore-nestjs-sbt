import { checkRuc } from "@/lib/sunat";

export interface ICreateOrganizationDto {
  name: string;
  category: string;
  ruc: string;
  size: number;
}

export const checkCreateOrganizationDto = (
  dto: ICreateOrganizationDto,
): string | null => {
  const errorMessage = checkRuc(dto.ruc);
  if (errorMessage) return errorMessage;

  if (!dto.name) return "name is required";
  if (dto.name.length < 3) {
    return "company name must be at least 3 characters";
  }

  if (!dto.category) return "category is required";

  if (!dto.size) return "size is required";
  if (dto.size < 1) {
    return "team size must be greater than 0";
  }

  return null;
};
