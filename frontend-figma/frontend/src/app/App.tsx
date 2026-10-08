import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import LoginPage from './components/LoginPage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import Dashboard from './components/Dashboard';
import TicketsList from './components/TicketsList';
import CreateTicket from './components/CreateTicket';
import Credits from './components/Credits';
import TicketDetail from './components/TicketDetail';
import AdminPanel from './components/AdminPanel';
import AdminUsers from './components/AdminUsers';
import AdminUserDetail from './components/AdminUserDetail';
import AdminGroups from './components/AdminGroups';
import AdminGroupDetail from './components/AdminGroupDetail';
import AdminSlaPolicies from './components/AdminSlaPolicies';
import AdminRoles from './components/AdminRoles';
import AdminRoleDetail from './components/AdminRoleDetail';
import DashboardClassic from './components/legacy/Dashboard.classic';
import TicketsListClassic from './components/legacy/TicketsList.classic';
import CreateTicketClassic from './components/legacy/CreateTicket.classic';
import TicketDetailClassic from './components/legacy/TicketDetail.classic';
import { isClassicUi } from './components/SupportShell';
import { getToken, isAdmin, isTechnician, can, refreshAccess, getHomePath } from '../lib/auth';

function DashboardPage() {
  return isClassicUi() ? <DashboardClassic /> : <Dashboard />;
}

function TicketsPage() {
  return isClassicUi() ? <TicketsListClassic /> : <TicketsList />;
}

function CreateTicketPage() {
  return isClassicUi() ? <CreateTicketClassic /> : <CreateTicket />;
}

function TicketDetailPage() {
  return isClassicUi() ? <TicketDetailClassic /> : <TicketDetail />;
}

function RequireAuth({ children }: { children: ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/" replace />;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/" replace />;
  if (!can('admin.access')) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequirePermission({ code, children }: { code: string; children: ReactNode }) {
  if (!getToken()) return <Navigate to="/" replace />;
  if (!can(code)) return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AccessGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (getToken()) await refreshAccess();
      if (!cancelled) setReady(true);
    })();
    return () => { cancelled = true; };
  }, []);

  if (!ready) return null;
  return <>{children}</>;
}

function RequireTechnician({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/" replace />;
  if (!isTechnician() && !isAdmin()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function BlockTechnicianFromUserArea({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/" replace />;
  if (!can('tickets.create')) return <Navigate to={getHomePath()} replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AccessGate>
      <div className="size-full">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/tickets" element={<RequireAuth><TicketsPage /></RequireAuth>} />
          <Route path="/tickets/:id" element={<RequireAuth><TicketDetailPage /></RequireAuth>} />
          <Route path="/create-ticket" element={<RequireAuth><BlockTechnicianFromUserArea><CreateTicketPage /></BlockTechnicianFromUserArea></RequireAuth>} />
          <Route path="/credits" element={<RequireAuth><Credits /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequirePermission code="admin.users"><AdminUsers /></RequirePermission>} />
          <Route path="/admin/users/:id" element={<RequirePermission code="admin.users"><AdminUserDetail /></RequirePermission>} />
          <Route path="/admin/groups" element={<RequirePermission code="admin.groups"><AdminGroups /></RequirePermission>} />
          <Route path="/admin/groups/:id" element={<RequirePermission code="admin.groups"><AdminGroupDetail /></RequirePermission>} />
          <Route path="/admin/sla" element={<RequirePermission code="admin.settings"><AdminSlaPolicies /></RequirePermission>} />
          <Route path="/admin/roles" element={<RequirePermission code="admin.roles"><AdminRoles /></RequirePermission>} />
          <Route path="/admin/roles/new" element={<RequirePermission code="admin.roles"><AdminRoleDetail /></RequirePermission>} />
          <Route path="/admin/roles/:id" element={<RequirePermission code="admin.roles"><AdminRoleDetail /></RequirePermission>} />
          <Route path="/panel-tecnico" element={<RequireTechnician><Navigate to="/tickets?view=system:all_my_groups" replace /></RequireTechnician>} />
          <Route path="/technician" element={<Navigate to="/tickets?view=system:all_my_groups" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
      </AccessGate>
    </BrowserRouter>
  );
}
