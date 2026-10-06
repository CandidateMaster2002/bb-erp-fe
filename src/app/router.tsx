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
        path: 'leads/:id',
        element: <LeadDetail />,
      },
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
        path: 'more',
        element: <Placeholder title="Settings & More" />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
