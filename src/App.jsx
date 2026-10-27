import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

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
import { api, clearToken, getToken } from "./services/api";

function ProtectedRoute({ authReady, user, children }) {
  if (!authReady) return <div className="app-state">Opening your field journal…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function currentCropStorageKey(accountId) {
  return "shambaSmart.currentCropId." + accountId;
}

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [crops, setCrops] = useState([]);
  const [currentCropId, setCurrentCropId] = useState(null);

  const restoreCropSelection = (account, accountCrops) => {
    let savedId = null;
    try {
      savedId = localStorage.getItem(currentCropStorageKey(account.id));
    } catch {
      savedId = null;
    }
    const selectedId = accountCrops.some((crop) => crop.id === savedId)
      ? savedId
      : accountCrops[0]?.id ?? null;
    setCurrentCropId(selectedId);
  };

  const chooseCurrentCrop = (cropId) => {
    setCurrentCropId(cropId);
    if (!user) return;
    try {
      const key = currentCropStorageKey(user.id);
      if (cropId) localStorage.setItem(key, cropId);
      else localStorage.removeItem(key);
    } catch {
      // Selection remains active for this session if storage is unavailable.
    }
  };

  const loadAccount = async (account) => {
    setAuthReady(false);
    setUser(account);
    setCrops([]);
    setCurrentCropId(null);
    try {
      const accountCrops = await api.getCrops();
      setCrops(accountCrops);
      restoreCropSelection(account, accountCrops);
    } catch {
      setCrops([]);
    } finally {
      setAuthReady(true);
    }
  };

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!getToken()) {
        setAuthReady(true);
        return;
      }

      try {
        const result = await api.me();
        if (!active) return;
        setUser(result.user);
        const accountCrops = await api.getCrops();
        if (!active) return;
        setCrops(accountCrops);
        restoreCropSelection(result.user, accountCrops);
      } catch (error) {
        if (error.status === 401) clearToken();
        if (active) {
          setUser(null);
          setCrops([]);
          setCurrentCropId(null);
        }
      } finally {
        if (active) setAuthReady(true);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const currentCrop = useMemo(() => {
    if (crops.length === 0) return null;
    return crops.find((crop) => crop.id === currentCropId) || crops[0];
  }, [crops, currentCropId]);

  const logout = () => {
    clearToken();
    setUser(null);
    setCrops([]);
    setCurrentCropId(null);
  };

  return (
    <ToastProvider>
      <div>
        <Navbar user={user} onLogout={logout} />

        <main>
          <div className="container">
            <Routes>
              <Route path="/" element={<Home user={user} />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute authReady={authReady} user={user}>
                    <Dashboard currentCrop={currentCrop} setCrops={setCrops} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/crops"
                element={
                  <ProtectedRoute authReady={authReady} user={user}>
                    <Crops
                      crops={crops}
                      setCrops={setCrops}
                      currentCropId={currentCropId}
                      setCurrentCropId={chooseCurrentCrop}
                    />
                  </ProtectedRoute>
                }
              />
              <Route path="/learn" element={<Learn />} />
              <Route path="/about" element={<About />} />
              <Route
                path="/library"
                element={
                  <ProtectedRoute authReady={authReady} user={user}>
                    <CropLibrary
                      crops={crops}
                      setCrops={setCrops}
                      currentCropId={currentCropId}
                      currentCrop={currentCrop}
                    />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <Login onAuthenticated={loadAccount} />}
              />
              <Route
                path="/register"
                element={user ? <Navigate to="/dashboard" replace /> : <Register onAuthenticated={loadAccount} />}
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
