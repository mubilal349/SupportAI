import { Route, Routes } from "react-router-dom";

// Public Pages
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import NotFound from "../pages/NotFound";

// Admin
import AdminDashboard from "../pages/admin/Dashboard";

// Customer
import CustomerDashboard from "../pages/customer/Dashboard";
import CustomerChat from "../pages/customer/Chat";
import CustomerProfile from "../pages/customer/Profile";
import Conversations from "../pages/customer/Conversations";
import Tickets from "../pages/customer/tickets/Tickets";
import SupportLayout from "../pages/customer/SupportLayout";
import TicketDetails from "../pages/customer/tickets/TicketDetails";
import AITicketCreation from "../pages/customer/tickets/AITicketCreation";
import Notifications from "../pages/customer/notification/Notifications";
import KnowledgeBase from "../pages/customer/knowledge-base/KnowledgeBase";

// Agent
import AgentLayout from "../pages/agent/AgentLayout";
import AgentDashboard from "../pages/agent/AgentDashboard";

import TicketQueue from "../pages/agent/tickets/TicketQueue";
import AssignedTickets from "../pages/agent/tickets/AssignedTickets";
import AgentTicketDetails from "../pages/agent/tickets/AgentTicketDetails";

// Route Protection
import ProtectedRoute from "./ProtectedRoute";
import Help from "../pages/customer/Help";
import CustomerAnalytics from "../pages/customer/CustomerAnalytics";
import AgentProfile from "../pages/agent/AgentProfile";

const AppRoutes = () => {
  return (
    <Routes>
      {/* ========================================
          PUBLIC ROUTES
      ======================================== */}

      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* ========================================
          ADMIN ROUTES
      ======================================== */}

      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>

      {/* ========================================
          AGENT ROUTES
      ======================================== */}

      <Route
        path="/agent"
        element={
          <ProtectedRoute allowedRoles={["agent", "admin"]}>
            <AgentLayout />
          </ProtectedRoute>
        }
      >
        {/* Agent Dashboard */}
        <Route index element={<AgentDashboard />} />

        {/* All available tickets */}
        <Route path="queue" element={<TicketQueue />} />

        {/* Tickets assigned to the logged-in agent */}
        <Route path="tickets" element={<AssignedTickets />} />

        {/* Individual ticket */}
        <Route path="tickets/:ticketId" element={<AgentTicketDetails />} />
        {/* Agent Profile */}
        <Route path="profile" element={<AgentProfile />} />
      </Route>

      {/* ========================================
          CUSTOMER / SUPPORT ROUTES
      ======================================== */}

      <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
        <Route path="/support" element={<SupportLayout />}>
          {/* /support */}
          <Route index element={<CustomerDashboard />} />

          {/* /support/chat */}
          <Route path="chat" element={<CustomerChat />} />

          {/* /support/conversations */}
          <Route path="conversations" element={<Conversations />} />

          {/* /support/tickets */}
          <Route path="tickets" element={<Tickets />} />

          <Route
            path="/support/tickets/create-ai"
            element={<AITicketCreation />}
          />

          <Route path="/support/tickets/:id" element={<TicketDetails />} />

          {/* /support/profile */}
          <Route path="profile" element={<CustomerProfile />} />

          {/* /support/help */}
          <Route path="/support/help" element={<Help />} />

          {/* /support/analytics */}
          <Route path="/support/analytics" element={<CustomerAnalytics />} />

          {/* notifications */}
          <Route path="notifications" element={<Notifications />} />
          {/* knowledege-base */}
          <Route path="/support/knowledge-base" element={<KnowledgeBase />} />
        </Route>
      </Route>

      {/* ========================================
          ERROR ROUTES
      ======================================== */}

      <Route
        path="/unauthorized"
        element={
          <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
            <div className="text-center">
              <h1 className="text-4xl font-bold">Unauthorized</h1>

              <p className="mt-3 text-slate-400">
                You don't have permission to access this page.
              </p>
            </div>
          </div>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
