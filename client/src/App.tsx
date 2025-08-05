import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import SystemInit from "./pages/SystemInit";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { LanguageProvider } from "./contexts/LanguageContext";
import axios from "axios";

// API 기본 설정
axios.defaults.baseURL = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001';

function App() {
  const [isInitialized, setIsInitialized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await axios.get("/api/users/check-initialization");
        setIsInitialized(response.data.data.isInitialized);
      } catch (error) {
        console.error("Error checking system status:", error);
        // 오류 발생 시 초기화되지 않은 것으로 간주
        setIsInitialized(false);
      } finally {
        setLoading(false);
      }
    };

    checkSystemStatus();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <LanguageProvider>
      <Routes>
        {!isInitialized ? (
          // 시스템이 초기화되지 않은 경우
          <Route path="*" element={<SystemInit />} />
        ) : (
          // 시스템이 초기화된 경우
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<Dashboard />} />
          </>
        )}
      </Routes>
    </LanguageProvider>
  );
}

export default App; 