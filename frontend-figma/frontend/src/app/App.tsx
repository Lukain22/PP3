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
import DashboardClassic from './components/legacy/Dashboard.classic';
import TicketsListClassic from './components/legacy/TicketsList.classic';
import CreateTicketClassic from './components/legacy/CreateTicket.classic';
import TicketDetailClassic from './components/legacy/TicketDetail.classic';
import { isClassicUi } from './components/SupportShell';
import { getToken, isAdmin } from '../lib/auth';

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

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/" replace />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/" replace />;
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
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
          <Route path="/create-ticket" element={<RequireAuth><CreateTicketPage /></RequireAuth>} />
          <Route path="/credits" element={<RequireAuth><Credits /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminPanel /></RequireAdmin>} />
          <Route path="/admin/users" element={<RequireAdmin><AdminUsers /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}
