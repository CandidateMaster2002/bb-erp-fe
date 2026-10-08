import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppLayout from './AppLayout';
import Login from '../modules/auth/Login';

import LeadsList from '../modules/leads/pages/LeadsList';
import LeadDetail from '../modules/leads/pages/LeadDetail';
import PipelineBoard from '../modules/leads/pages/Pipeline';
import ReportsDashboard from '../modules/leads/pages/Reports';
import CategorySettings from '../modules/settings/pages/CategorySettings';
import ActionsAgenda from '../modules/actions/pages/ActionsAgenda';
import GlobalLinks from '../modules/links/pages/GlobalLinks';

import StaffingLayout from '../modules/staffing/pages/StaffingLayout';
import ClientsList from '../modules/staffing/pages/ClientsList';
import VendorsList from '../modules/staffing/pages/VendorsList';
import RequirementsList from '../modules/staffing/pages/RequirementsList';
import RequirementDetail from '../modules/staffing/pages/RequirementDetail';
import { Navigate } from 'react-router-dom';

// Placeholders for other routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-4"><h1 className="text-2xl font-bold">{title}</h1></div>
);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <ActionsAgenda />, // 'Actions' view is now default
      },
      {
        path: 'leads',
        element: <LeadsList />,
      },
      {
        path: 'leads/:id', element: <LeadDetail /> },
      { path: 'collaborators', element: <LeadsList recordType="COLLABORATOR" /> },
      { path: 'collaborators/:id', element: <LeadDetail recordType="COLLABORATOR" /> },
      {
        path: 'pipeline',
        element: <PipelineBoard />,
      },
      {
        path: 'reports',
        element: <ReportsDashboard />,
      },
      {
        path: 'links',
        element: <GlobalLinks />,
      },
      {
        path: 'settings',
        element: <CategorySettings />,
      },
      {
        path: 'staffing',
        element: <StaffingLayout />,
        children: [
          { index: true, element: <Navigate to="requirements" replace /> },
          { path: 'requirements', element: <RequirementsList /> },
          { path: 'requirements/:id', element: <RequirementDetail /> },
          { path: 'clients', element: <ClientsList /> },
          { path: 'vendors', element: <VendorsList /> },
        ]
      },
      {
        path: 'more',
        element: <Placeholder title="Settings & More" />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
