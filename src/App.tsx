import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import InitPage from "./pages/InitPage";
import LoginPage from "./pages/LoginPage";
// TODO: 실제 API 연동 필요
const checkUserExists = async () => {
  // 임시: 실제로는 API 호출
  return false; // 최초에는 user가 없다고 가정
};

function App() {
  const [loading, setLoading] = useState(true);
  const [hasUser, setHasUser] = useState<boolean | null>(null);

  useEffect(() => {
    checkUserExists().then(setHasUser).finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {!hasUser && <Route path="/init" element={<InitPage />} />}
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="*"
          element={<Navigate to={hasUser ? "/login" : "/init"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 