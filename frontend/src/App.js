import { BrowserRouter, Routes, Route } from "react-router-dom";

import Register from "./pages/Register";
import Login from "./pages/Login";
import RiskTest from "./pages/RiskTest";
import RiskResult from "./pages/RiskResult";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import Portfolio from "./pages/Portfolio";
import Layout from "./layout/Layout";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Flow */}
        <Route path="/" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/risk-test" element={<RiskTest />} />
        <Route path="/risk-result" element={<RiskResult />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/portfolio" element={<Portfolio />} />

        {/* Protected Pages */}
        <Route element={<Layout />}>
          <Route path="/home" element={<Dashboard />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/portfolio" element={<Portfolio />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
