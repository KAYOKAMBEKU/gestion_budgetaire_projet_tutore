import { useQuery } from "@tanstack/react-query";
import { departementService } from "../../../services/departementService";

export function useDepartements() {
  return useQuery({
    queryKey: ["departements"],
    queryFn: departementService.getAll,
  });
}
