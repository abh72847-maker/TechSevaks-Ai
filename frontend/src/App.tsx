import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import AdminDashboard from './pages/AdminDashboard';
import AIRecommendation from './pages/AIRecommendation';
import BuyerDashboard from './pages/BuyerDashboard';
import DigitalLots from './pages/DigitalLots';
import FarmerDashboard from './pages/FarmerDashboard';
import FpoDashboard from './pages/FpoDashboard';
import Landing from './pages/Landing';
import LotDetail from './pages/LotDetail';
import MarketIntelligence from './pages/MarketIntelligence';
import NetRealisation from './pages/NetRealisation';
import TransactionFlow from './pages/TransactionFlow';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="/app/farmer" replace />} />
        <Route path="farmer" element={<FarmerDashboard />} />
        <Route path="market" element={<MarketIntelligence />} />
        <Route path="realisation" element={<NetRealisation />} />
        <Route path="ai" element={<AIRecommendation />} />
        <Route path="buyer" element={<BuyerDashboard />} />
        <Route path="fpo" element={<FpoDashboard />} />
        <Route path="lots" element={<DigitalLots />} />
        <Route path="lots/:id" element={<LotDetail />} />
        <Route path="flow" element={<TransactionFlow />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}