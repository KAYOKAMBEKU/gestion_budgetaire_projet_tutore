import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { ManagerSidebar } from "../components/ManagerSidebar";

function AccessMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="max-w-lg rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
        <h1 className="text-xl font-bold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </main>
  );
}

export function ManagerDashboardPage() {
  const { authLoading, currentUser, isAuthenticated, isManager } = useAuth();

  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm font-semibold text-slate-600">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <AccessMessage message="Vous devez etre connecte pour acceder a cette page." title="Connexion requise" />;
  }
  if (!isManager) {
    return <AccessMessage message="Acces refuse. Cette page est reservee au gestionnaire budgetaire." title="Acces refuse" />;
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <ManagerSidebar />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6">
          <section className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Espace gestionnaire</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Bienvenue, {currentUser?.prenom ?? currentUser?.nom}</h1>
            <p className="mt-2 text-sm text-slate-600">Vous pouvez superviser les projets des Chefs de projet de votre departement.</p>
          </section>
        </div>
      </div>
    </main>
  );
}

export function ManagerIndexRedirect() {
  return <Navigate replace to="/manager" />;
}
