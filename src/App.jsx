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
import Register from "./pages/Register";

import { api, getToken, clearToken } from "./services/api";

const STORAGE_KEY = "shambaSmart.crops.v1";
const STORAGE_CURRENT_KEY = "shambaSmart.currentCropId.v1";

function RequireAuth({ token, children }) {
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [token, setTokenState] = useState(() => getToken());

  const [crops, setCrops] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
  }, [crops]);

  useEffect(() => {
    if (currentCropId) localStorage.setItem(STORAGE_CURRENT_KEY, currentCropId);
    else localStorage.removeItem(STORAGE_CURRENT_KEY);
  }, [currentCropId]);

  useEffect(() => {
    if (crops.length === 0) {
      setCurrentCropId(null);
      return;
    }
    const stillExists = crops.some((c) => c.id === currentCropId);
    if (!stillExists) setCurrentCropId(crops[0].id);
  }, [crops, currentCropId]);

  const currentCrop = useMemo(() => {
    if (crops.length === 0) return null;
    return crops.find((c) => c.id === currentCropId) || crops[0];
  }, [crops, currentCropId]);

  useEffect(() => {
    if (!token) return;

    api
      .getCrops()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCrops(list);

        setCurrentCropId((prev) => {
          if (prev && list.some((c) => c.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      })
      .catch((err) => {
        console.error("Failed to load crops:", err);
      });
  }, [token]);

  return (
    <ToastProvider>
      <div>
        <Navbar isLoggedIn={!!token} onLogout={handleLogout} />

        <main>
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />

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

              <Route
                path="/register"
                element={
                  token ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Register onLoginSuccess={handleLoginSuccess} />
                  )
                }
              />

              <Route
                path="/dashboard"
                element={
                  <RequireAuth token={token}>
                    <Dashboard currentCrop={currentCrop} setCrops={setCrops} />
                  </RequireAuth>
                }
              />

              <Route
                path="/crops"
                element={
                  <RequireAuth token={token}>
                    <Crops
                      crops={crops}
                      setCrops={setCrops}
                      currentCropId={currentCropId}
                      setCurrentCropId={setCurrentCropId}
                    />
                  </RequireAuth>
                }
              />

              <Route path="/learn" element={<Learn />} />
              <Route path="/about" element={<About />} />

              <Route
                path="/library"
                element={
                  <RequireAuth token={token}>
                    <CropLibrary
                      crops={crops}
                      setCrops={setCrops}
                      currentCropId={currentCropId}
                      setCurrentCropId={setCurrentCropId}
                    />
                  </RequireAuth>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;