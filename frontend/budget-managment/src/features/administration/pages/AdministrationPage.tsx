import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useAppDispatch, useAppSelector } from "../../../store";
import { setActiveAdminSection } from "../../../store/slices/adminSlice";
import { setCurrentAdminTab } from "../../../store/slices/uiSlice";
import { AdminSidebar, type AdminSectionId } from "../components/AdminSidebar";
import { AdminTabs, type AdminTabId } from "../components/AdminTabs";
import { Dashboard } from "../components/Dashboard";
import { Toast } from "../components/Toast";
import { SubmittedBudgetsList } from "../components/budgets/SubmittedBudgetsList";
import { DepartementList } from "../components/departements/DepartementList";
import { ExerciceBudgetaireList } from "../components/exercices/ExerciceBudgetaireList";
import { PermissionList } from "../components/permissions/PermissionList";
import { RoleList } from "../components/roles/RoleList";
import { UserList } from "../components/users/UserList";
import { LoginPage } from "./LoginPage";
import { CreateBudgetPage } from "../../manager/pages/CreateBudgetPage";
import { ManagerDashboardPage } from "../../manager/pages/ManagerDashboardPage";
import { ManagerProjectsPage } from "../../manager/pages/ManagerProjectsPage";
import { ManagerProjectDetailPage } from "../../manager/pages/ManagerProjectDetailPage";

function UserAdministrationSection({ activeTab }: { activeTab: AdminTabId }) {
  if (activeTab === "roles") {
    return <RoleList />;
  }
  if (activeTab === "permissions") {
    return <PermissionList />;
  }
  return <UserList />;
}

function ActiveSection({ activeSection, activeTab, onTabChange }: { activeSection: AdminSectionId; activeTab: AdminTabId; onTabChange: (tab: AdminTabId) => void }) {
  if (activeSection === "dashboard") {
    return <Dashboard />;
  }
  if (activeSection === "departements") {
    return <DepartementList />;
  }
  if (activeSection === "exercices") {
    return <ExerciceBudgetaireList />;
  }
  if (activeSection === "budgetValidation") {
    return <SubmittedBudgetsList />;
  }
  return (
    <div className="grid gap-5">
      <AdminTabs activeTab={activeTab} onChange={onTabChange} />
      <UserAdministrationSection activeTab={activeTab} />
    </div>
  );
}

export function AdministrationPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentAdminTab } = useAppSelector((state) => state.ui);
  const { activeAdminSection } = useAppSelector((state) => state.admin);
  const { currentUser, isAdmin, logout } = useAuth();
  const activeTab = currentAdminTab as AdminTabId;
  const activeSection = activeAdminSection as AdminSectionId;

  function changeTab(tab: AdminTabId) {
    dispatch(setCurrentAdminTab(tab));
  }

  function changeSection(section: AdminSectionId) {
    dispatch(setActiveAdminSection(section));
    if (section === "users") {
      dispatch(setCurrentAdminTab("users"));
    }
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-5xl rounded-lg bg-white p-6 text-left shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">Acces refuse</h1>
          <p className="mt-2 text-slate-600">Votre profil ne dispose pas des droits administrateur.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 lg:flex">
      <AdminSidebar activeSection={activeSection} onChange={changeSection} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">
          <header className="rounded-lg bg-white p-6 text-left shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Administration</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950">Espace administrateur</h1>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  Tableau de bord, utilisateurs, validations budgetaires, departements et exercices budgetaires.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Connecte: <span className="font-semibold text-slate-950">{currentUser?.email}</span>
                </div>
                <button className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={handleLogout}>
                  Deconnexion
                </button>
              </div>
            </div>
          </header>
          <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
            <ActiveSection activeSection={activeSection} activeTab={activeTab} onTabChange={changeTab} />
          </section>
        </div>
      </div>
      <Toast />
    </main>
  );
}

function ProtectedAdministration() {
  const { authLoading, isAdmin, isAuthenticated, isManager } = useAuth();
  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm font-semibold text-slate-600">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }
  if (!isAdmin && isManager) {
    return <Navigate replace to="/manager" />;
  }
  return <AdministrationPage />;
}

function HomeRedirect() {
  const { authLoading, isAdmin, isAuthenticated, isManager } = useAuth();
  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 text-sm font-semibold text-slate-600">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }
  if (isAdmin) {
    return <Navigate replace to="/administration" />;
  }
  if (isManager) {
    return <Navigate replace to="/manager" />;
  }
  return <Navigate replace to="/login" />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route element={<HomeRedirect />} path="/" />
      <Route element={<ProtectedAdministration />} path="/administration" />
      <Route element={<ManagerDashboardPage />} path="/manager" />
      <Route element={<CreateBudgetPage />} path="/manager/budgets/create" />
      <Route element={<ManagerProjectsPage />} path="/manager/projects" />
      <Route element={<ManagerProjectDetailPage />} path="/manager/projects/:id" />
      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  );
}
