import { createBrowserRouter } from 'react-router';
import { CitizenLayout } from '@/layouts/CitizenLayout';
import { StaffLayout } from '@/layouts/StaffLayout';
import { HomePage } from '@/pages/citizen/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { RouteError } from '@/pages/RouteError';

// Heavy screens (Leaflet, Recharts) are code-split so the citizen landing page stays light on mobile.
export const router = createBrowserRouter([
  {
    element: <CitizenLayout />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/report', lazy: async () => ({ Component: (await import('@/pages/citizen/ReportPage')).ReportPage }) },
      { path: '/track/:id?', lazy: async () => ({ Component: (await import('@/pages/citizen/TrackPage')).TrackPage }) },
    ],
  },
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    element: <StaffLayout roles={['officer', 'admin']} />,
    errorElement: <RouteError />,
    children: [
      { path: '/officer', lazy: async () => ({ Component: (await import('@/pages/officer/OfficerQueuePage')).OfficerQueuePage }) },
      { path: '/officer/issue/:id', lazy: async () => ({ Component: (await import('@/pages/officer/OfficerIssuePage')).OfficerIssuePage }) },
    ],
  },
  {
    element: <StaffLayout roles={['admin']} />,
    errorElement: <RouteError />,
    children: [{ path: '/admin/analytics', lazy: async () => ({ Component: (await import('@/pages/admin/AdminAnalyticsPage')).AdminAnalyticsPage }) }],
  },
  { path: '*', element: <NotFoundPage /> },
]);
