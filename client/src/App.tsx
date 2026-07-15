import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const InterviewPage = lazy(() => import('./pages/InterviewPage'));
const PrepPage = lazy(() => import('./pages/PrepPage'));
const PrepResultPage = lazy(() => import('./pages/PrepResultPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-mist">加载中...</div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/interview/new" element={<InterviewPage />} />
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/prep/new" element={<PrepPage />} />
        <Route path="/prep/:id" element={<PrepResultPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Suspense>
  );
}
