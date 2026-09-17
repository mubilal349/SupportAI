import { Route, Routes } from "react-router-dom";

// Public Pages
import Home from "../pages/Home";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import NotFound from "../pages/NotFound";

// ============================================================
// ADMIN
// ============================================================

import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/Dashboard";

import AdminUsers from "../pages/admin/users/Users";
import AdminUserDetails from "../pages/admin/users/UserDetails";
import AdminEditUser from "../pages/admin/users/EditUser";

import AdminTickets from "../pages/admin/tickets/Tickets";
import AdminTicketDetails from "../pages/admin/tickets/TicketDetails";

import AdminAgents from "../pages/admin/agents/Agents";
import AdminAgentDetails from "../pages/admin/agents/AgentDetails";
import AdminAgentEdit from "../pages/admin/agents/EditAgent";

import AdminKnowledgeBase from "../pages/admin/knowledge-base/KnowledgeBase";
import AdminArticleEditor from "../pages/admin/knowledge-base/ArticleEditor";

import AdminCannedResponses from "../pages/admin/canned-responses/CannedResponses";

import AdminSLAManagement from "../pages/admin/sla/SLAManagement";

import AdminAnalytics from "../pages/admin/analytics/Analytics";

import AdminAuditLogs from "../pages/admin/audit/AuditLogs";

import AdminSettings from "../pages/admin/settings/Settings";

import AdminNotifications from "../pages/admin/AdminNotifications";

import AdminRolePermissions from "../pages/admin/AdminRolePermissions";

import AdminEscalations from "../pages/admin/escalation/AdminEscalations";

import AdminArticleView from "../pages/admin/knowledge-base/ArticleView";

import CannedResponseEditor from "../pages/admin/canned-responses/CannedResponseEditor";

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
import Help from "../pages/customer/Help";
import CustomerAnalytics from "../pages/customer/CustomerAnalytics";
import CreateTicket from "../pages/customer/tickets/CreateTicket";
import CreateTicketForm from "../pages/customer/tickets/CreateTicketForm";

// Agent
import AgentLayout from "../pages/agent/AgentLayout";
import AgentDashboard from "../pages/agent/AgentDashboard";
import TicketQueue from "../pages/agent/tickets/TicketQueue";
import AssignedTickets from "../pages/agent/tickets/AssignedTickets";
import AgentTicketDetails from "../pages/agent/tickets/AgentTicketDetails";
import AgentProfile from "../pages/agent/AgentProfile";
import MyTickets from "../pages/agent/tickets/MyTickets";
import AgentCustomerProfile from "../pages/agent/AgentCustomerProfile";
import EscalatedTickets from "../pages/agent/EscalatedTickets";
import AgentAnalytics from "../pages/agent/AgentAnalytics";
import AgentKnowledgeBase from "../pages/agent/KnowledgeBase";
import KnowledgeBaseDetails from "../pages/agent/KnowledgeBaseDetails";

// Route Protection
import ProtectedRoute from "./ProtectedRoute";

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
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="dashboard.view"
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Users */}
          <Route
            path="users"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="users.manage"
              >
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="users/new"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="users.manage"
              >
                <AdminEditUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="users/:userId/edit"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="users.manage"
              >
                <AdminEditUser />
              </ProtectedRoute>
            }
          />

          <Route
            path="users/:userId"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="users.manage"
              >
                <AdminUserDetails />
              </ProtectedRoute>
            }
          />

          {/* Tickets */}

          <Route
            path="tickets"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="tickets.view"
              >
                <AdminTickets />
              </ProtectedRoute>
            }
          />

          <Route
            path="tickets/:ticketId"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="tickets.view"
              >
                <AdminTicketDetails />
              </ProtectedRoute>
            }
          />

          {/* Agents */}

          <Route
            path="agents"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="agents.manage"
              >
                <AdminAgents />
              </ProtectedRoute>
            }
          />

          <Route
            path="agents/:agentId/edit"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="agents.manage"
              >
                <AdminAgentEdit />
              </ProtectedRoute>
            }
          />

          <Route
            path="agents/:agentId"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="agents.manage"
              >
                <AdminAgentDetails />
              </ProtectedRoute>
            }
          />

          {/* Escalations */}

          <Route
            path="escalations"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminEscalations />
              </ProtectedRoute>
            }
          />

          {/* Knowledge Base */}

          <Route
            path="knowledge-base"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="knowledge_base.manage"
              >
                <AdminKnowledgeBase />
              </ProtectedRoute>
            }
          />

          {/* Create New Article */}
          <Route
            path="knowledge-base/new"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="knowledge_base.manage"
              >
                <AdminArticleEditor />
              </ProtectedRoute>
            }
          />

          {/* Edit Existing Article */}
          <Route
            path="knowledge-base/:articleId/edit"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="knowledge_base.manage"
              >
                <AdminArticleEditor />
              </ProtectedRoute>
            }
          />

          {/* View Existing Article */}
          <Route
            path="knowledge-base/:articleId"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="knowledge_base.manage"
              >
                <AdminArticleView />
              </ProtectedRoute>
            }
          />

          {/* Canned Responses */}

          <Route
            path="canned-responses"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="canned_responses.view"
              >
                <AdminCannedResponses />
              </ProtectedRoute>
            }
          />
          <Route
            path="canned-responses/new"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="canned_responses.view"
              >
                <CannedResponseEditor />
              </ProtectedRoute>
            }
          />

          <Route
            path="canned-responses/:responseId/edit"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="canned_responses.view"
              >
                <CannedResponseEditor />
              </ProtectedRoute>
            }
          />

          {/* SLA */}

          <Route
            path="sla"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="sla.manage"
              >
                <AdminSLAManagement />
              </ProtectedRoute>
            }
          />

          {/* Analytics */}

          <Route
            path="analytics"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="analytics.view"
              >
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Audit Logs */}

          <Route
            path="audit-logs"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="audit_logs.view"
              >
                <AdminAuditLogs />
              </ProtectedRoute>
            }
          />

          {/* System Settings */}

          <Route
            path="settings"
            element={
              <ProtectedRoute
                allowedRoles={["admin"]}
                requiredPermission="settings.manage"
              >
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Notifications */}

          <Route
            path="notifications"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminNotifications />
              </ProtectedRoute>
            }
          />

          <Route path="role-permissions" element={<AdminRolePermissions />} />
        </Route>
      </Route>

      {/* ========================================
    AGENT ROUTES
======================================== */}

      <Route element={<ProtectedRoute allowedRoles={["agent"]} />}>
        <Route path="/agent" element={<AgentLayout />}>
          {/* ========================================
        DASHBOARD
    ======================================== */}

          <Route
            index
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="dashboard.view"
              >
                <AgentDashboard />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        TICKET QUEUE
    ======================================== */}

          <Route
            path="queue"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="tickets.view"
              >
                <TicketQueue />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        MY TICKETS
    ======================================== */}

          <Route
            path="my-tickets"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="tickets.view"
              >
                <MyTickets />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        ASSIGNED TICKETS
    ======================================== */}

          <Route
            path="assigned-tickets"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="tickets.view"
              >
                <AssignedTickets />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        TICKET DETAILS
    ======================================== */}

          <Route
            path="tickets/:ticketId"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="tickets.view"
              >
                <AgentTicketDetails />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        ESCALATED TICKETS
    ======================================== */}

          <Route
            path="escalated"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="tickets.view"
              >
                <EscalatedTickets />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        KNOWLEDGE BASE
    ======================================== */}

          <Route
            path="knowledge-base"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="knowledge_base.view"
              >
                <AgentKnowledgeBase />
              </ProtectedRoute>
            }
          />

          <Route
            path="knowledge-base/:articleId"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="knowledge_base.view"
              >
                <KnowledgeBaseDetails />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        ANALYTICS
    ======================================== */}

          <Route
            path="analytics"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="analytics.limited"
              >
                <AgentAnalytics />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        PROFILE
    ======================================== */}

          <Route path="profile" element={<AgentProfile />} />

          {/* ========================================
        CUSTOMER PROFILE
    ======================================== */}

          <Route
            path="/agent/customers/:customerId"
            element={
              <ProtectedRoute
                allowedRoles={["agent"]}
                requiredPermission="tickets.view"
              >
                <AgentCustomerProfile />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* ========================================
    CUSTOMER / SUPPORT ROUTES
======================================== */}

      <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
        <Route path="/support" element={<SupportLayout />}>
          {/* ========================================
                   DASHBOARD
             ======================================== */}

          <Route
            index
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
                requiredPermission="dashboard.view"
              >
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        CHAT
    ======================================== */}

          <Route path="chat" element={<CustomerChat />} />

          {/* ========================================
        CONVERSATIONS
    ======================================== */}

          <Route path="conversations" element={<Conversations />} />

          {/* ========================================
        TICKETS
    ======================================== */}

          <Route
            path="tickets"
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
                requiredPermission="tickets.view"
              >
                <Tickets />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        CREATE TICKET
    ======================================== */}

          <Route
            path="tickets/create"
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
                requiredPermission="tickets.create"
              >
                <CreateTicket />
              </ProtectedRoute>
            }
          />

          <Route
            path="tickets/create-form"
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
                requiredPermission="tickets.create"
              >
                <CreateTicketForm />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        AI TICKET CREATION
    ======================================== */}

          <Route
            path="tickets/create-ai"
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
                requiredPermission="tickets.create"
              >
                <AITicketCreation />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        TICKET DETAILS
    ======================================== */}

          <Route
            path="tickets/:id"
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
                requiredPermission="tickets.view"
              >
                <TicketDetails />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        PROFILE
    ======================================== */}

          <Route path="profile" element={<CustomerProfile />} />

          {/* ========================================
        HELP
    ======================================== */}

          <Route path="help" element={<Help />} />

          {/* ========================================
        ANALYTICS
    ======================================== */}

          <Route
            path="analytics"
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
                requiredPermission="analytics.own"
              >
                <CustomerAnalytics />
              </ProtectedRoute>
            }
          />

          {/* ========================================
        NOTIFICATIONS
    ======================================== */}

          <Route path="notifications" element={<Notifications />} />

          {/* ========================================
        KNOWLEDGE BASE
    ======================================== */}

          <Route
            path="knowledge-base"
            element={
              <ProtectedRoute
                allowedRoles={["customer"]}
                requiredPermission="knowledge_base.view"
              >
                <KnowledgeBase />
              </ProtectedRoute>
            }
          />
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
