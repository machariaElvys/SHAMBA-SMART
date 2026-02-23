import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastProvider } from "./components/ToastProvider";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Crops from "./pages/Crops";
import Learn from "./pages/Learn";
import About from "./pages/About";
import CropLibrary from "./pages/cropLibrary";
import Login from "./pages/Login";

import { api, getToken, clearToken } from "./services/api";

const STORAGE_CURRENT_KEY = "shambaSmart.currentCropId.v1";

function App() {
  const [token, setTokenState] = useState(() => getToken());

  const [crops, setCrops] = useState([]);

  const [currentCropId, setCurrentCropId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_CURRENT_KEY) || null;
    } catch {
      return null;
    }
  });

  const handleLoginSuccess = (newToken) => {
    setTokenState(newToken);
  };

  const handleLogout = () => {
    clearToken();
    setTokenState(null);
    setCrops([]);
    setCurrentCropId(null);
  };

  // Persist currentCropId (nice UX)
  useEffect(() => {
    try {
      if (currentCropId) localStorage.setItem(STORAGE_CURRENT_KEY, currentCropId);
      else localStorage.removeItem(STORAGE_CURRENT_KEY);
    } catch {
      // ignore
    }
  }, [currentCropId]);

  // Load crops from API only when logged in
  useEffect(() => {
    if (!token) {
      setCrops([]);
      setCurrentCropId(null);
      return;
    }

    api.getCrops()
      .then((data) => {
        const list = data || [];
        setCrops(list);

        setCurrentCropId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      })
      .catch((err) => {
        console.error(err);
        // If token is invalid/expired, api.js clears token on 401
        if (!getToken()) handleLogout();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Keep currentCropId valid if crops list changes (delete, etc.)
  useEffect(() => {
    if (!crops.length) {
      if (currentCropId !== null) setCurrentCropId(null);
      return;
    }
    const stillExists = crops.some((c) => c.id === currentCropId);
    if (!stillExists) setCurrentCropId(crops[0].id);
  }, [crops, currentCropId]);

  const currentCrop = useMemo(() => {
    if (!crops.length) return null;
    return crops.find((c) => c.id === currentCropId) || crops[0];
  }, [crops, currentCropId]);

  const requireAuth = (element) => (token ? element : <Navigate to="/login" replace />);

  return (
    <ToastProvider>
      <div>
        <Navbar isLoggedIn={!!token} onLogout={handleLogout}/>

        <main>
          <div className="container">
            <Routes>
              <Route
                path="/login"
                element={
                  token ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login onLoginSuccess={handleLoginSuccess} />
                  )
                }
              />

              <Route path="/" element={requireAuth(<Home />)} />

              <Route
                path="/dashboard"
                element={requireAuth(<Dashboard currentCrop={currentCrop} setCrops={setCrops} />)}
              />

              <Route
                path="/crops"
                element={requireAuth(
                  <Crops
                    crops={crops}
                    setCrops={setCrops}
                    currentCropId={currentCropId}
                    setCurrentCropId={setCurrentCropId}
                  />
                )}
              />

              <Route path="/learn" element={requireAuth(<Learn />)} />
              <Route path="/about" element={requireAuth(<About />)} />

              <Route
                path="/library"
                element={requireAuth(
                  <CropLibrary
                    crops={crops}
                    setCrops={setCrops}
                    currentCropId={currentCropId}
                    setCurrentCropId={setCurrentCropId}
                  />
                )}
              />

              <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;