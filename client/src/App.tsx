import { Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';

const HomePage = lazy(() => import('./pages/HomePage'));
const InterviewPage = lazy(() => import('./pages/InterviewPage'));
const PrepPage = lazy(() => import('./pages/PrepPage'));
const PrepResultPage = lazy(() => import('./pages/PrepResultPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const ResumePage = lazy(() => import('./pages/ResumePage'));

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse text-mist text-sm">加载中...</div>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  // 模拟面试进行中 → 全屏专注模式（无侧边栏）
  const focused = /^\/interview(\/|$)/.test(pathname);

  if (focused) {
    return (
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/interview/new" element={<InterviewPage />} />
          <Route path="/interview/:id" element={<InterviewPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/prep/new" element={<PrepPage />} />
            <Route path="/prep/:id" element={<PrepResultPage />} />
            <Route path="/resume" element={<ResumePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}
