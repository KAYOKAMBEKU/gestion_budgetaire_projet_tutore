import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { useAppDispatch, useAppSelector } from "../../../store";
import { setActiveAdminSection } from "../../../store/slices/adminSlice";
import { setCurrentAdminTab } from "../../../store/slices/uiSlice";
import { AdminSidebar, type AdminSectionId } from "../components/AdminSidebar";
import { AdminTabs, type AdminTabId } from "../components/AdminTabs";
import { Dashboard } from "../components/Dashboard";
import { Toast } from "../components/Toast";
import { BudgetReportsSection } from "../components/budgets/BudgetReportsSection";
import { SubmittedBudgetsList } from "../components/budgets/SubmittedBudgetsList";
import { DepartementList } from "../components/departements/DepartementList";
import { ExerciceBudgetaireList } from "../components/exercices/ExerciceBudgetaireList";
import { PermissionList } from "../components/permissions/PermissionList";
import { RoleList } from "../components/roles/RoleList";
import { UserList } from "../components/users/UserList";
import { LoginPage } from "./LoginPage";
import { ManagerDashboardPage } from "../../manager/pages/ManagerDashboardPage";
import { ManagerBudgetDetailPage } from "../../manager/pages/ManagerBudgetDetailPage";
import { ManagerBudgetsPage } from "../../manager/pages/ManagerBudgetsPage";
import { ManagerProjectsPage } from "../../manager/pages/ManagerProjectsPage";
import { ManagerProjectDetailPage } from "../../manager/pages/ManagerProjectDetailPage";
import { CreateProjectBudgetPage } from "../../manager/pages/CreateProjectBudgetPage";
import { ChefDashboardPage } from "../../manager/pages/ChefDashboardPage";
import { ChefProjectsPage } from "../../manager/pages/ChefProjectsPage";
import { ChefSubmissionsPage } from "../../manager/pages/ChefSubmissionsPage";
import { ComptableAnalyseEcartsPage } from "../../comptable/pages/ComptableAnalyseEcartsPage";
import { ComptableBudgetDetailPage } from "../../comptable/pages/ComptableBudgetDetailPage";
import { ComptableBudgetsPage } from "../../comptable/pages/ComptableBudgetsPage";
import { ComptableDashboardPage } from "../../comptable/pages/ComptableDashboardPage";
import { ComptableMouvementsPage } from "../../comptable/pages/ComptableMouvementsPage";
import { ComptableRealisationsPage } from "../../comptable/pages/ComptableRealisationsPage";

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
  if (activeSection === "approvedBudgets") {
    return <SubmittedBudgetsList approvedOnly />;
  }
  if (activeSection === "budgetReports") {
    return <BudgetReportsSection />;
  }
  return (
    <div className="grid gap-5">
      <AdminTabs activeTab={activeTab} onChange={onTabChange} />
      <UserAdministrationSection activeTab={activeTab} />
    </div>
  );
}

export function AdministrationPage() {
  const dispatch = useAppDispatch();
  const { currentAdminTab } = useAppSelector((state) => state.ui);
  const { activeAdminSection } = useAppSelector((state) => state.admin);
  const { isAdmin } = useAuth();
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

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#F4F7FA] p-6">
        <div className="mx-auto max-w-5xl rounded-lg bg-white p-6 text-left shadow-sm">
          <h1 className="text-2xl font-bold text-[#1F2937]">Acces refuse</h1>
          <p className="mt-2 text-[#6B7280]">Votre profil ne dispose pas des droits administrateur.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F7FA] lg:flex">
      <AdminSidebar activeSection={activeSection} onChange={changeSection} />
      <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6">

          <section className="rounded-lg bg-white p-4 shadow-sm sm:p-6">
            <ActiveSection activeSection={activeSection} activeTab={activeTab} onTabChange={changeTab} />
          </section>
        </div>
      </div>
      <Toast />
    </main>
  );
}

function ProtectedAdministration() {
  const { authLoading, isAdmin, isAuthenticated, isManager, isProjectManager, isComptable } = useAuth();
  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }
  if (!isAdmin && isProjectManager) {
    return <Navigate replace to="/chef/dashboard" />;
  }
  if (!isAdmin && isManager) {
    return <Navigate replace to="/manager/budgets" />;
  }
  if (!isAdmin && isComptable) {
    return <Navigate replace to="/comptable/dashboard" />;
  }
  return <AdministrationPage />;
}

function HomeRedirect() {
  const { authLoading, isAdmin, isAuthenticated, isManager, isProjectManager, isComptable } = useAuth();
  if (authLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#F4F7FA] text-sm font-semibold text-[#6B7280]">Verification de la session...</main>;
  }
  if (!isAuthenticated) {
    return <Navigate replace to="/login" />;
  }
  if (isAdmin) {
    return <Navigate replace to="/administration" />;
  }
  if (isProjectManager) {
    return <Navigate replace to="/chef/dashboard" />;
  }
  if (isManager) {
    return <Navigate replace to="/manager/budgets" />;
  }
  if (isComptable) {
    return <Navigate replace to="/comptable/dashboard" />;
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
      <Route element={<ManagerBudgetsPage />} path="/manager/budgets" />
      <Route element={<ManagerBudgetDetailPage />} path="/manager/budgets/:id" />
      <Route element={<ManagerBudgetsPage analysisOnly />} path="/manager/analyse-budgetaire" />
      <Route element={<Navigate replace to="/manager/projects" />} path="/manager/budgets/create" />
      <Route element={<ManagerProjectsPage />} path="/manager/projects" />
      <Route element={<ManagerProjectDetailPage />} path="/manager/projects/:id" />
      <Route element={<ChefDashboardPage />} path="/chef/dashboard" />
      <Route element={<ChefProjectsPage />} path="/chef/projets" />
      <Route element={<CreateProjectBudgetPage />} path="/chef/budgets" />
      <Route element={<CreateProjectBudgetPage />} path="/chef/budgets/create" />
      <Route element={<ChefSubmissionsPage />} path="/chef/soumissions" />
      <Route element={<ComptableDashboardPage />} path="/comptable/dashboard" />
      <Route element={<ComptableBudgetsPage />} path="/comptable/budgets" />
      <Route element={<ComptableBudgetDetailPage />} path="/comptable/budgets/:id" />
      <Route element={<ComptableMouvementsPage />} path="/comptable/mouvements" />
      <Route element={<Navigate replace to="/comptable/mouvements" />} path="/comptable/entrees" />
      <Route element={<Navigate replace to="/comptable/mouvements" />} path="/comptable/sorties" />
      <Route element={<ComptableRealisationsPage />} path="/comptable/realisations" />
      <Route element={<ComptableAnalyseEcartsPage />} path="/comptable/analyse-ecarts" />
      <Route element={<Navigate replace to="/login" />} path="*" />
    </Routes>
  );
}
