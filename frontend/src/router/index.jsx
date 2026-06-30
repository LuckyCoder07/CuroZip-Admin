import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Public
import LoginPage from '../pages/LoginPage';

// Protected pages
import DashboardPage   from '../pages/DashboardPage';
import HubsPage        from '../pages/HubsPage';
import HubDetailPage   from '../pages/HubDetailPage';
import UsersPage       from '../pages/UsersPage';
import CustomersPage   from '../pages/CustomersPage';
import RolesPage       from '../pages/RolesPage';
import DepartmentsPage from '../pages/DepartmentsPage';
import VendorsPage     from '../pages/VendorsPage';
import OrdersPage      from '../pages/OrdersPage';
import OrderDetailPage from '../pages/OrderDetailPage';
import SettingsPage    from '../pages/SettingsPage';
import NotFoundPage    from '../pages/NotFoundPage';
import UnauthorizedPage from '../pages/UnauthorizedPage';

const AppRouter = () => {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected — super_admin only */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"    element={<DashboardPage />} />
        <Route path="/hubs"         element={<HubsPage />} />
        <Route path="/hubs/:id"     element={<HubDetailPage />} />
        <Route path="/users"        element={<UsersPage />} />
        <Route path="/customers"    element={<CustomersPage />} />
        <Route path="/roles"        element={<RolesPage />} />
        <Route path="/departments"  element={<DepartmentsPage />} />
        <Route path="/vendors"      element={<VendorsPage />} />
        <Route path="/orders"       element={<OrdersPage />} />
        <Route path="/orders/:id"   element={<OrderDetailPage />} />
        <Route path="/settings"     element={<SettingsPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;
