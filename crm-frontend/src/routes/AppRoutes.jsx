import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/layout/ProtectedRoute.jsx';

import LoginPage from '../pages/auth/LoginPage.jsx';
import AdminLoginPage from '../pages/auth/AdminLoginPage.jsx'; // add
import FounderDashboard from '../pages/dashboard/FounderDashboard.jsx';
import TeamLeadDashboard from '../pages/dashboard/TeamLeadDashboard.jsx';
import BdeDashboardPage from '../pages/dashboard/BdeDashboardPage.jsx';
import LeadsListPage from '../pages/leads/LeadsListPage.jsx';
import LeadProfilePage from '../pages/leads/LeadProfilePage.jsx';
import KanbanPage from '../pages/leads/KanbanPage.jsx';
import MyCalendarPage from '../pages/calendar/MyCalendarPage.jsx';
import TeamCalendarPage from '../pages/calendar/TeamCalendarPage.jsx';
import MapViewPage from '../pages/map/MapViewPage.jsx';
import TeamManagementPage from '../pages/team/TeamManagementPage.jsx';
import MemberProfile from '../pages/team/MemberProfile.jsx';
import ImportDataPage from '../pages/import/ImportDataPage.jsx';
import ReportsPage from '../pages/reports/ReportsPage.jsx';
import FraudReviewPage from '../pages/fraud/FraudReviewPage.jsx';
import AuditLogPage from '../pages/audit/AuditLogPage.jsx'; // add
import SettingsPage from '../pages/settings/SettingsPage.jsx';
import CategoryBuilderPage from '../pages/settings/CategoryBuilderPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import CoverageSummaryPage from '../pages/map/CoverageSummaryPage.jsx';
import CoverageTrackerPage from '../pages/coverage/CoverageTrackerPage.jsx'; // new


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/leads" replace />} />

        <Route path="/dashboard/founder" element={<FounderDashboard />} />
        <Route path="/dashboard/team" element={<TeamLeadDashboard />} />
        <Route path="/dashboard/bde" element={<BdeDashboardPage />} />

        <Route path="/leads" element={<LeadsListPage />} />
        <Route path="/leads/:id" element={<LeadProfilePage />} />
        <Route path="/leads-kanban" element={<KanbanPage />} />

        <Route path="/calendar" element={<MyCalendarPage />} />
        <Route path="/calendar/team" element={<TeamCalendarPage />} />

        <Route path="/map" element={<MapViewPage />} />
        <Route path="/coverage-summary" element={<CoverageSummaryPage />} />
        <Route path="/coverage-tracker" element={<CoverageTrackerPage />} />


        <Route path="/team" element={<TeamManagementPage />} />
        <Route path="/team/:id" element={<MemberProfile />} />

        <Route path="/import" element={<ImportDataPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/fraud" element={<FraudReviewPage />} />
        <Route path="/audit-logs" element={<AuditLogPage />} />

        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/categories" element={<CategoryBuilderPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
