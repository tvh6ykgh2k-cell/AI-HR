import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<div className="p-8 text-center text-2xl">AI 面试官 🎯</div>} />
      </Routes>
    </div>
  );
}
