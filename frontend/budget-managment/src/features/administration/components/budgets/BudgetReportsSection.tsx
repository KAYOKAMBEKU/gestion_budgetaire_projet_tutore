import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../../../api/client";
import { apiClient } from "../../../../api/client";
import { budgetAnalyticsService } from "../../../../services/budgetAnalyticsService";
import { ligneBudgetaireService } from "../../../../services/ligneBudgetaireService";
import { formatAmount } from "../../../manager/utils/formatAmount";
import { InlineError, LoadingState } from "../SectionHeader";

type ReportOutputType = "general" | "execution" | "ecarts" | "departements";
type ChartRow = { label: string; value: number; valueType?: "amount" | "percent" | "count" };

const sidebarBlue = "#0F3D5E";

const reportOutputLabels: Record<ReportOutputType, string> = {
  general: "Etat general budgetaire",
  execution: "Etat d'execution budgetaire",
  ecarts: "Etat des ecarts",
  departements: "Etat par departement",
};

type SaveFilePicker = (options: {
  suggestedName: string;
  types: { accept: Record<string, string[]>; description: string }[];
}) => Promise<{
  createWritable: () => Promise<{
    close: () => Promise<void>;
    write: (data: Blob) => Promise<void>;
  }>;
}>;

function getReportFilename(outputType: ReportOutputType) {
  return `${reportOutputLabels[outputType].toLowerCase().replace(/\s+/g, "-")}.pdf`;
}

function formatChartValue(row: ChartRow) {
  if (row.valueType === "percent") {
    return `${row.value.toFixed(2)}%`;
  }
  if (row.valueType === "count") {
    return String(row.value);
  }
  return formatAmount(row.value);
}

function getChartWidth(value: number, maxValue: number) {
  if (value === 0) {
    return "0%";
  }
  return `${Math.max(4, (Math.abs(value) / maxValue) * 100)}%`;
}

export function BudgetReportsSection() {
  const [outputType, setOutputType] = useState<ReportOutputType>("general");
  const reportQuery = useQuery({
    queryKey: ["admin", "budget-reports-full"],
    queryFn: async () => {
      const budgets = await budgetAnalyticsService.getBudgetsByStatuses();
      const executions = await budgetAnalyticsService.getExecutionByBudgetIds(budgets.filter((budget) => ["en_execution", "execute", "cloture"].includes(budget.statut)).map((budget) => budget.id));
      const rows = await Promise.all(
        budgets.map(async (budget) => ({
          budget,
          execution: executions[budget.id],
          lignes: await ligneBudgetaireService.getLignesByBudget(budget.id),
        })),
      );
      return rows;
    },
  });

  const rows = useMemo(() => reportQuery.data ?? [], [reportQuery.data]);
  const filteredRows = rows;

  const totalRecettesPrevues = filteredRows.reduce((sum, row) => sum + row.lignes.filter((ligne) => ligne.type_ligne === "recette").reduce((lineSum, ligne) => lineSum + Number(ligne.montant_prevu ?? 0), 0), 0);
  const totalDepensesPrevues = filteredRows.reduce((sum, row) => sum + row.lignes.filter((ligne) => ligne.type_ligne === "depense").reduce((lineSum, ligne) => lineSum + Number(ligne.montant_prevu ?? 0), 0), 0);
  const totalRecettesRealisees = filteredRows.reduce((sum, row) => sum + Number(row.execution?.total_recettes_realisees ?? row.budget.total_recettes_realisees ?? 0), 0);
  const totalDepensesRealisees = filteredRows.reduce((sum, row) => sum + Number(row.execution?.total_depenses_realisees ?? row.budget.total_depenses_realisees ?? row.budget.montant_total_realise ?? 0), 0);
  const reportRows = useMemo(
    () =>
      filteredRows.map(({ budget, execution }) => {
        const prevu = Number(budget.montant_total_prevu ?? 0);
        const realise = Number(execution?.montant_realise_total ?? budget.montant_total_realise ?? 0);
        const ecart = realise - prevu;
        const taux = prevu > 0 ? (realise / prevu) * 100 : 0;
        const interpretation = Math.abs(ecart) < 1 ? "Conforme" : ecart > 0 ? "Defavorable" : "Favorable";
        return {
          budget,
          departement: budget.projet?.departement?.nom ?? `Departement ${budget.departement_id}`,
          ecart,
          exercice: budget.exercice?.libelle ?? `Exercice ${budget.exercice_id}`,
          interpretation,
          projet: budget.projet?.titre ?? String(budget.projet_id ?? "-"),
          realise,
          taux,
          prevu,
          recettesPrevues: budget.montant_total_prevu ? filteredRows.find((row) => row.budget.id === budget.id)?.lignes.filter((ligne) => ligne.type_ligne === "recette").reduce((sum, ligne) => sum + Number(ligne.montant_prevu ?? 0), 0) ?? 0 : 0,
          depensesPrevues: filteredRows.find((row) => row.budget.id === budget.id)?.lignes.filter((ligne) => ligne.type_ligne === "depense").reduce((sum, ligne) => sum + Number(ligne.montant_prevu ?? 0), 0) ?? 0,
          recettesRealisees: Number(execution?.total_recettes_realisees ?? budget.total_recettes_realisees ?? 0),
          depensesRealisees: Number(execution?.total_depenses_realisees ?? budget.total_depenses_realisees ?? budget.montant_total_realise ?? 0),
        };
      }),
    [filteredRows],
  );
  const departementRows = useMemo(() => {
    const grouped = new Map<string, { budgets: number; departement: string; ecart: number; prevu: number; realise: number }>();
    for (const row of reportRows) {
      const current = grouped.get(row.departement) ?? { budgets: 0, departement: row.departement, ecart: 0, prevu: 0, realise: 0 };
      current.budgets += 1;
      current.prevu += row.prevu;
      current.realise += row.realise;
      current.ecart += row.ecart;
      grouped.set(row.departement, current);
    }
    return Array.from(grouped.values()).map((row) => ({ ...row, taux: row.prevu > 0 ? (row.realise / row.prevu) * 100 : 0 }));
  }, [reportRows]);
  const totalPrevisionnel = reportRows.reduce((sum, row) => sum + row.prevu, 0);
  const totalRealise = reportRows.reduce((sum, row) => sum + row.realise, 0);
  const tauxGlobal = totalPrevisionnel > 0 ? (totalRealise / totalPrevisionnel) * 100 : 0;
  const amountChartRows: ChartRow[] = [
    { label: "Total previsionnel", value: totalPrevisionnel },
    { label: "Total realise", value: totalRealise },
    { label: "Recettes prevues", value: totalRecettesPrevues },
    { label: "Recettes realisees", value: totalRecettesRealisees },
    { label: "Depenses prevues", value: totalDepensesPrevues },
    { label: "Depenses realisees", value: totalDepensesRealisees },
  ];
  const varianceChartRows: ChartRow[] = [
    { label: "Ecart recettes", value: totalRecettesRealisees - totalRecettesPrevues },
    { label: "Ecart depenses", value: totalDepensesRealisees - totalDepensesPrevues },
    { label: "Ecart resultat", value: (totalRecettesRealisees - totalDepensesRealisees) - (totalRecettesPrevues - totalDepensesPrevues) },
  ];
  const chartSections = (() => {
    if (outputType === "execution") {
      return [
        {
          title: "Execution budgetaire",
          subtitle: "Montants realises",
          rows: [
            { label: "Total realise", value: totalRealise },
            { label: "Recettes realisees", value: totalRecettesRealisees },
            { label: "Depenses realisees", value: totalDepensesRealisees },
            { label: "Taux execution global", value: tauxGlobal, valueType: "percent" },
          ] satisfies ChartRow[],
        },
        {
          title: "Taux par projet",
          subtitle: "Progression d'execution",
          rows: reportRows.map((row) => ({ label: row.projet, value: row.taux, valueType: "percent" as const })),
        },
      ];
    }

    if (outputType === "ecarts") {
      return [
        {
          title: "Ecarts budgetaires",
          subtitle: "Recettes, depenses et resultat",
          rows: varianceChartRows,
        },
        {
          title: "Ecarts par projet",
          subtitle: "Realise moins previsionnel",
          rows: reportRows.map((row) => ({ label: row.projet, value: row.ecart })),
        },
      ];
    }

    if (outputType === "departements") {
      return [
        {
          title: "Realisation par departement",
          subtitle: "Total realise",
          rows: departementRows.map((row) => ({ label: row.departement, value: row.realise })),
        },
        {
          title: "Taux par departement",
          subtitle: "Execution budgetaire",
          rows: departementRows.map((row) => ({ label: row.departement, value: row.taux, valueType: "percent" as const })),
        },
      ];
    }

    return [
      {
        title: "Statistiques financieres",
        subtitle: "Montants prevus et realises",
        rows: amountChartRows,
      },
      {
        title: "Ecarts et execution",
        subtitle: "Synthese des variations",
        rows: [...varianceChartRows, { label: "Taux execution global", value: tauxGlobal, valueType: "percent" as const }],
      },
    ];
  })();

  async function exportPdf() {
    const { data } = await apiClient.get<ArrayBuffer>("/rapports-budgetaires/export-pdf", {
      params: { type_rapport: outputType },
      responseType: "arraybuffer",
    });
    const pdfBlob = new Blob([data], { type: "application/pdf" });
    if (pdfBlob.size === 0) {
      throw new Error("Le rapport PDF genere est vide.");
    }

    const filename = getReportFilename(outputType);
    const picker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;

    if (picker) {
      const handle = await picker({
        suggestedName: filename,
        types: [{ accept: { "application/pdf": [".pdf"] }, description: "Document PDF" }],
      });
      const writable = await handle.createWritable();
      await writable.write(pdfBlob);
      await writable.close();
      return;
    }

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  if (reportQuery.isLoading) {
    return <LoadingState />;
  }

  if (reportQuery.isError) {
    return <InlineError message={getApiErrorMessage(reportQuery.error)} />;
  }

  return (
    <div className="grid gap-5">
      <div className="text-left">
        <h2 className="text-xl font-bold text-[#1F2937]">Rapports budgetaires</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Analyse previsionnel, realise, ecarts et taux d'execution.</p>
      </div>
      <div className="no-print flex flex-col gap-4 rounded-lg border border-[#B7E4CF] bg-[#ECFDF5] p-4 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-[#065F46]">Filtres de rapport</p>
          <p className="mt-1 text-xs text-[#047857]">Choisissez le type d'etat a afficher puis exportez-le en PDF.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(reportOutputLabels).map(([value, label]) => {
            const active = outputType === value;
            return (
              <button
                className={`flex min-h-12 items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm font-semibold transition ${
                  active ? "border-[#16A34A] bg-white text-[#065F46] shadow-sm ring-2 ring-[#86EFAC]" : "border-[#D1FAE5] bg-[#F8FAFC] text-[#374151] hover:border-[#A7F3D0] hover:bg-white"
                }`}
                key={value}
                onClick={() => setOutputType(value as ReportOutputType)}
                type="button"
              >
                <span>{label}</span>
                {active ? (
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#16A34A] text-sm font-bold leading-none text-white" title="Filtre selectionne">
                    ✓
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="rounded-md bg-[#0F3D5E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2D46]" onClick={exportPdf} type="button">Exporter PDF</button>
        </div>
      </div>
      <div className="print-area grid gap-5">
      <div className="rounded-lg bg-white/30 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">Etat selectionne</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold text-[#1F2937]">{reportOutputLabels[outputType]}</h3>
            <p className="mt-1 text-sm text-[#6B7280]">{filteredRows.length} budget(s) inclus dans cet etat.</p>
          </div>
          <p className="text-sm font-semibold text-[#6B7280]">Genere le {new Date().toLocaleDateString("fr-FR")}</p>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {chartSections.map((section) => {
          const maxChartValue = Math.max(1, ...section.rows.map((row) => Math.abs(row.value)));
          return (
            <div className="rounded-lg bg-white/30 p-4" key={section.title}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7280]">{section.title}</p>
                  <h4 className="mt-1 text-base font-bold text-[#1F2937]">{section.subtitle}</h4>
                </div>
                <p className="rounded-md bg-[#DCEAF3] px-3 py-1 text-xs font-semibold text-[#0F3D5E]">{filteredRows.length} budget(s)</p>
              </div>
              <div className="grid gap-3">
                {section.rows.length === 0 ? (
                  <p className="rounded-md bg-[#F9FAFB] px-3 py-4 text-center text-sm font-semibold text-[#6B7280]">Aucune donnee pour ce filtre.</p>
                ) : (
                  section.rows.map((row) => (
                    <div className="grid gap-1" key={`${section.title}-${row.label}`}>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate font-semibold text-[#374151]">{row.label}</span>
                        <span className="shrink-0 font-bold text-[#1F2937]">{formatChartValue(row)}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
                        <div className="h-full rounded-full" style={{ backgroundColor: sidebarBlue, width: getChartWidth(row.value, maxChartValue) }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="overflow-hidden border border-[#0F3D5E] bg-white/30">
        <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-[#0F3D5E]/50">
            {outputType === "departements" ? (
              <tr>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Departement</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Budgets</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Total previsionnel</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Total realise</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Ecart</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Taux</th>
              </tr>
            ) : (
              <tr>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Projet</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Departement</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Exercice</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Statut</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Budget previsionnel</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Budget realise</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Ecart</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Taux</th>
                <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Interpretation</th>
                {outputType === "execution" ? <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Recettes / depenses realisees</th> : null}
                {outputType === "ecarts" ? <th className="border border-[#0F3D5E] px-4 py-3 font-semibold text-white">Detail ecarts</th> : null}
              </tr>
            )}
          </thead>
          <tbody>
            {outputType === "departements" ? (
              departementRows.length === 0 ? (
                <tr><td className="border border-[#0F3D5E] px-4 py-8 text-center text-[#6B7280]" colSpan={6}>Aucun budget pour ces filtres.</td></tr>
              ) : departementRows.map((row) => (
                <tr key={row.departement}>
                  <td className="border border-[#0F3D5E] px-4 py-3 font-semibold text-[#1F2937]">{row.departement}</td>
                  <td className="border border-[#0F3D5E] px-4 py-3">{row.budgets}</td>
                  <td className="border border-[#0F3D5E] px-4 py-3">{formatAmount(row.prevu)}</td>
                  <td className="border border-[#0F3D5E] px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(row.realise)}</td>
                  <td className="border border-[#0F3D5E] px-4 py-3">{formatAmount(row.ecart)}</td>
                  <td className="border border-[#0F3D5E] px-4 py-3">{row.taux.toFixed(2)}%</td>
                </tr>
              ))
            ) : reportRows.length === 0 ? (
              <tr><td className="border border-[#0F3D5E] px-4 py-8 text-center text-[#6B7280]" colSpan={outputType === "general" ? 9 : 10}>Aucun budget pour ces filtres.</td></tr>
            ) : reportRows.map((row) => (
              <tr key={row.budget.id}>
                <td className="border border-[#0F3D5E] px-4 py-3 font-semibold text-[#1F2937]">{row.projet}</td>
                <td className="border border-[#0F3D5E] px-4 py-3 text-[#6B7280]">{row.departement}</td>
                <td className="border border-[#0F3D5E] px-4 py-3 text-[#6B7280]">{row.exercice}</td>
                <td className="border border-[#0F3D5E] px-4 py-3 text-[#6B7280]">{row.budget.statut}</td>
                <td className="border border-[#0F3D5E] px-4 py-3">{formatAmount(row.prevu)}</td>
                <td className="border border-[#0F3D5E] px-4 py-3 font-semibold text-[#1F2937]">{formatAmount(row.realise)}</td>
                <td className="border border-[#0F3D5E] px-4 py-3">{formatAmount(row.ecart)}</td>
                <td className="border border-[#0F3D5E] px-4 py-3">{row.taux.toFixed(2)}%</td>
                <td className="border border-[#0F3D5E] px-4 py-3 font-semibold text-[#374151]">{row.interpretation}</td>
                {outputType === "execution" ? <td className="border border-[#0F3D5E] px-4 py-3">{formatAmount(row.recettesRealisees)} / {formatAmount(row.depensesRealisees)}</td> : null}
                {outputType === "ecarts" ? <td className="border border-[#0F3D5E] px-4 py-3">Recettes: {formatAmount(row.recettesRealisees - row.recettesPrevues)} / Depenses: {formatAmount(row.depensesRealisees - row.depensesPrevues)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      </div>
    </div>
  );
}
