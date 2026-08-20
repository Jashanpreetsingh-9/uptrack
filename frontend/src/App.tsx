import { BrowserRouter, Route, Routes, useParams } from 'react-router-dom';
import { DashboardPage, TargetDetailPage } from './pages/Dashboard';

function TargetRoute() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <p className="px-4 py-8 text-sm text-gray-500">Missing target ID</p>;
  }
  return <TargetDetailPage targetId={id} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/targets/:id" element={<TargetRoute />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
