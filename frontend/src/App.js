import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Portfolio from "./pages/Portfolio";
import Valuations from "./pages/Valuations";
import Simulations from "./pages/Simulations";
import Recommendations from "./pages/Recommendations";
import RiskTest from "./pages/RiskTest";
import RiskResult from "./pages/RiskResult";
import Calculators from "./pages/Calculators";
import Profile from "./pages/Profile";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes inside Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/valuations" element={<Valuations />} />
            <Route path="/simulations" element={<Simulations />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/risk-test" element={<RiskTest />} />
            <Route path="/risk-result" element={<RiskResult />} />
            <Route path="/calculators" element={<Calculators />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
