import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'sonner';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import TicketsList from './components/TicketsList';
import CreateTicket from './components/CreateTicket';
import Credits from './components/Credits';
import DashboardClassic from './components/legacy/Dashboard.classic';
import TicketsListClassic from './components/legacy/TicketsList.classic';
import CreateTicketClassic from './components/legacy/CreateTicket.classic';
import { isClassicUi } from './components/SupportShell';

function DashboardPage() {
  return isClassicUi() ? <DashboardClassic /> : <Dashboard />;
}

function TicketsPage() {
  return isClassicUi() ? <TicketsListClassic /> : <TicketsList />;
}

function CreateTicketPage() {
  return isClassicUi() ? <CreateTicketClassic /> : <CreateTicket />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="size-full">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/create-ticket" element={<CreateTicketPage />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </div>
    </BrowserRouter>
  );
}
