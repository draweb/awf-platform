import { ApiError } from "./errors";
import { isValidArtifactName } from "@/lib/domain/artifacts";

export function decodeArtifactNameParam(encodedName: string): string {
  let name: string;
  try {
    name = decodeURIComponent(encodedName);
  } catch {
    throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Nombre codificado inválido" });
  }
  if (!isValidArtifactName(name)) {
    throw new ApiError({ code: "VALIDATION_ERROR", httpStatus: 400, message: "Nombre de artefacto inválido" });
  }
  return name;
}
