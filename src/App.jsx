import React, { Suspense, useState } from "react";
import { Routes, Route, Navigate } from "react-router";

const Login = React.lazy(() => import("./pages/Login"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const TeamDashboard = React.lazy(() => import("./pages/TeamDashboard"));

function App() {
  const [role, setRole] = useState(localStorage.getItem("role")?.toLowerCase().trim() || null);

  const handleLoginSuccess = () => {
    const newRole = localStorage.getItem("role")?.toLowerCase().trim();
    setRole(newRole); 
  };

  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-900 text-white text-2xl font-bold italic">Բեռնվում է...</div>}>
      <Routes>
        <Route path="/" element={<Login onLoginSuccess={handleLoginSuccess} />} />
        
        <Route
          path="/admin-dashboard"
          element={role === "admin" ? <AdminDashboard /> : <Navigate to="/" />}
        />
        
        <Route
          path="/team-dashboard"
          element={["teama", "teamb"].includes(role) ? <TeamDashboard /> : <Navigate to="/" />}
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default App;