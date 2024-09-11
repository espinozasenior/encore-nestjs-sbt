import { checkRuc } from "@/lib/sunat";
import { TEAM_SIZES, type TeamSize } from "../types/team-size";

export interface ICreateOrganizationDto {
  name: string;
  category: string;
  ruc: string;
  size: TeamSize;
}

export const checkCreateOrganizationDto = (
  dto: ICreateOrganizationDto,
  validRubros: string[],
): string | null => {
  const errorMessage = checkRuc(dto.ruc);
  if (errorMessage) return errorMessage;

  if (!dto.name) return "name is required";
  if (dto.name.length < 3) {
    return "company name must be at least 3 characters";
  }

  if (!dto.category) return "category is required";

  if (!validRubros.includes(dto.category)) {
    return `category is not between the following rubros: ${validRubros.join(", ")}`;
  }

  if (!dto.size) return "size is required";

  if (!TEAM_SIZES.includes(dto.size)) {
    return `size must be one of the following values: ${TEAM_SIZES.join(", ")}`;
  }

  return null;
};
