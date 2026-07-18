import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import LoginPage from './components/LoginPage';
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
import DashboardClassic from './components/legacy/Dashboard.classic';
import TicketsListClassic from './components/legacy/TicketsList.classic';
import CreateTicketClassic from './components/legacy/CreateTicket.classic';
import TicketDetailClassic from './components/legacy/TicketDetail.classic';
import { isClassicUi } from './components/SupportShell';
import { getToken, isAdmin, isTechnician } from '../lib/auth';

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
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireTechnician({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/" replace />;
  if (!isTechnician() && !isAdmin()) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function BlockTechnicianFromUserArea({ children }: { children: ReactNode }) {
  if (!getToken()) return <Navigate to="/" replace />;
  if (isTechnician()) return <Navigate to="/tickets?view=system:all_my_groups" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="size-full">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/tickets" element={<RequireAuth><TicketsPage /></RequireAuth>} />
          <Route path="/tickets/:id" element={<RequireAuth><TicketDetailPage /></RequireAuth>} />
          <Route path="/create-ticket" element={<RequireAuth><BlockTechnicianFromUserArea><CreateTicketPage /></BlockTechnicianFromUserArea></RequireAuth>} />
          <Route path="/credits" element={<RequireAuth><Credits /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
          <Route path="/admin/users/:id" element={<RequireAdmin><AdminUserDetail /></RequireAdmin>} />
          <Route path="/admin/groups" element={<RequireAdmin><AdminGroups /></RequireAdmin>} />
          <Route path="/admin/groups/:id" element={<RequireAdmin><AdminGroupDetail /></RequireAdmin>} />
          <Route path="/admin/sla" element={<RequireAdmin><AdminSlaPolicies /></RequireAdmin>} />
          <Route path="/panel-tecnico" element={<RequireTechnician><Navigate to="/tickets?view=system:all_my_groups" replace /></RequireTechnician>} />
          <Route path="/technician" element={<Navigate to="/tickets?view=system:all_my_groups" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}
