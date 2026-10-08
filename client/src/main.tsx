import { MotionConfig } from 'framer-motion';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import 'leaflet/dist/leaflet.css';
import './index.css';
import { AuthProvider } from './lib/auth';
import { I18nProvider } from './lib/i18n';
import { router } from './router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* reducedMotion="user" honours prefers-reduced-motion for every framer-motion animation */}
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-center" richColors closeButton toastOptions={{ style: { borderRadius: 14, fontFamily: 'Inter, sans-serif' } }} />
        </AuthProvider>
      </I18nProvider>
    </MotionConfig>
  </StrictMode>,
);
