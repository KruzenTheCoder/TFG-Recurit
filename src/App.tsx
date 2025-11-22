import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CampaignsPage from "./pages/CampaignsPage";
import CandidatesPage from "./pages/CandidatesPage";
import FormsPage from "./pages/FormsPage";
import FormBuilderPage from "./pages/FormBuilderPage";
import ReportingPage from "./pages/ReportingPage";
import PublicApplicationPage from "./pages/PublicApplicationPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/apply/:formId" element={<PublicApplicationPage />} />
      
      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <DashboardPage />
          </Layout>
        </ProtectedRoute>
      }>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="forms" element={<FormsPage />} />
        <Route path="forms/builder" element={<FormBuilderPage />} />
        <Route path="forms/builder/:formId" element={<FormBuilderPage />} />
        <Route path="reporting" element={<ReportingPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
