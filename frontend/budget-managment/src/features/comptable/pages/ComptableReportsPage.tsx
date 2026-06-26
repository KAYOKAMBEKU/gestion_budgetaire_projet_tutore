import { useAuth } from "../../../context/AuthContext";
import { BudgetReportsSection } from "../../administration/components/budgets/BudgetReportsSection";
import { ComptableSidebar } from "../components/ComptableSidebar";

function AccessMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F4F7FA] p-6">
      <div className="max-w-lg rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-[#E5E7EB]">
        <h1 className="text-xl font-bold text-[#1F2937]">{title}</h1>
        <p className="mt-2 text-sm text-[#6B7280]">{message}</p>
      </div>
    </main>
  );
}

export function ComptableReportsPage() {
  const { authLoading, isAuthenticated, isComptable } = useAuth();

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isComptable) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au Comptable." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <ComptableSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
            <BudgetReportsSection
              allowedOutputTypes={["entrees", "sorties"]}
              defaultOutputType="entrees"
              title="Rapports comptables"
            />
          </section>
        </div>
      </div>
    </main>
  );
}
