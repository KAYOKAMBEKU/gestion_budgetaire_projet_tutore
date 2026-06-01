import { Link } from "react-router-dom";

type ProjectRecord = object;

type ProjectTableProps<TProject extends ProjectRecord> = {
  projects?: TProject[];
  data?: TProject[];
  items?: TProject[];
  loading?: boolean;
  isLoading?: boolean;
  onView?: (project: TProject) => void;
  onEdit?: (project: TProject) => void;
  onDelete?: (project: TProject) => void;
};

const asText = (value: unknown, fallback = "-") => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("fr-FR").format(value);
  }

  return String(value);
};

const getValue = (project: ProjectRecord, keys: string[]) => {
  const source = project as Record<string, unknown>;

  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }

  return undefined;
};

const getProjectName = (project: ProjectRecord) =>
  asText(getValue(project, ["titre", "name", "title", "nom", "libelle"]), "Projet sans nom");

const getProjectStatus = (project: ProjectRecord) =>
  asText(getValue(project, ["status", "statut", "state", "etat"]));

const getProjectBudget = (project: ProjectRecord) => {
  const budget = getValue(project, ["cout_estime", "budget", "totalBudget", "montant", "amount"]);

  if (typeof budget === "number") {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      maximumFractionDigits: 0,
    }).format(budget);
  }

  return asText(budget);
};

const getProjectOwner = (project: ProjectRecord) =>
  getValue(project, ["chef_projet", "manager", "owner", "responsable", "createdBy"]);

const getProjectOwnerLabel = (project: ProjectRecord) => {
  const owner = getProjectOwner(project);

  if (typeof owner === "object" && owner !== null) {
    const source = owner as Record<string, unknown>;
    return `${asText(source.prenom, "").trim()} ${asText(source.nom, "").trim()}`.trim() || asText(source.email);
  }

  return asText(owner);
};

const getProjectId = (project: ProjectRecord) => getValue(project, ["id", "_id", "uuid"]);

export function ProjectTable<TProject extends ProjectRecord>({
  projects,
  data,
  items,
  loading,
  isLoading,
  onView,
  onEdit,
  onDelete,
}: ProjectTableProps<TProject>) {
  const projectList = projects ?? data ?? items ?? [];
  const showActions = Boolean(onView || onEdit || onDelete || projectList.length > 0);

  if (loading || isLoading) {
    return <div className="bg-white px-4 py-6 text-center text-sm text-[#6B7280]">Chargement des projets...</div>;
  }

  if (projectList.length === 0) {
    return <div className="bg-white px-4 py-6 text-center text-sm text-[#6B7280]">Aucun projet non affecte disponible.</div>;
  }

  return (
    <div className="max-w-full overflow-x-auto bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#F9FAFB]">
          <tr className="border-b border-[#E5E7EB]">
            <th className="px-4 py-3 font-semibold text-[#374151]">Projet</th>
            <th className="px-4 py-3 font-semibold text-[#374151]">Responsable</th>
            <th className="px-4 py-3 font-semibold text-[#374151]">Budget</th>
            <th className="px-4 py-3 font-semibold text-[#374151]">Statut</th>
            {showActions ? <th className="px-4 py-3 font-semibold text-[#374151]">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {projectList.map((project, index) => {
            const projectId = getProjectId(project);
            const key = asText(projectId, String(index));

            return (
              <tr key={key}>
                <td className="px-4 py-3 font-semibold text-[#1F2937]">{getProjectName(project)}</td>
                <td className="px-4 py-3 text-[#6B7280]">{getProjectOwnerLabel(project)}</td>
                <td className="px-4 py-3 font-semibold text-[#1F2937]">{getProjectBudget(project)}</td>
                <td className="px-4 py-3 text-[#6B7280]">{getProjectStatus(project)}</td>
                {showActions ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {projectId ? (
                        <Link
                          className="inline-flex items-center rounded-md border border-[#0F3D5E] px-3 py-1.5 text-xs font-semibold text-[#0F3D5E] hover:bg-[#0F3D5E] hover:text-white"
                          to={`/manager/projects/${projectId}`}
                        >
                          Details
                        </Link>
                      ) : null}
                      {onView ? (
                        <button type="button" onClick={() => onView(project)}>
                          Voir
                        </button>
                      ) : null}
                      {onEdit ? (
                        <button type="button" onClick={() => onEdit(project)}>
                          Modifier
                        </button>
                      ) : null}
                      {onDelete ? (
                        <button type="button" onClick={() => onDelete(project)}>
                          Supprimer
                        </button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
