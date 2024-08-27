// Validate the given RUC number and return an error message if it is invalid.
export const checkRuc = (ruc: string): string | null => {
  if (!ruc) return "ruc is required";
  if (ruc.length !== 11) return "ruc must have 11 digits";

  if (Number.isNaN(Number.parseInt(ruc))) {
    return "ruc must be contain only digits";
  }

  if (ruc[0] !== "1" && ruc[0] !== "2") {
    return "ruc must start with 1 or 2";
  }

  return null;
};
