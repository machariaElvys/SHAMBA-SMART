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
import { cropStorage } from "./services/cropStorage";
import { journalStorage } from "./services/journalStorage";

const STORAGE_CURRENT_KEY = "shambaSmart.currentCropId.v1";

function App() {
  const [crops, setCrops] = useState(() => cropStorage.getAll());
  const [notes, setNotes] = useState(() => journalStorage.getNotes());
  const [tasks, setTasks] = useState(() => journalStorage.getTasks());
  const [irrigation, setIrrigation] = useState(() => journalStorage.getIrrigation());

  const [currentCropId, setCurrentCropId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_CURRENT_KEY) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    cropStorage.saveAll(crops);
  }, [crops]);

  useEffect(() => { journalStorage.saveNotes(notes); }, [notes]);
  useEffect(() => { journalStorage.saveTasks(tasks); }, [tasks]);
  useEffect(() => { journalStorage.saveIrrigation(irrigation); }, [irrigation]);

  const effectiveCurrentCropId = crops.some((crop) => crop.id === currentCropId)
    ? currentCropId
    : crops[0]?.id || null;

  useEffect(() => {
    try {
      if (effectiveCurrentCropId) localStorage.setItem(STORAGE_CURRENT_KEY, effectiveCurrentCropId);
      else localStorage.removeItem(STORAGE_CURRENT_KEY);
    } catch {
      // The app remains usable when browser storage is disabled.
    }
  }, [effectiveCurrentCropId]);

  const currentCrop = useMemo(() => {
    if (crops.length === 0) return null;
    return crops.find((c) => c.id === effectiveCurrentCropId) || crops[0];
  }, [crops, effectiveCurrentCropId]);

  return (
    <ToastProvider>
      <div>
        <Navbar />

        <main>
          <div className="container">
            <Routes>
              <Route path="/" element={<Home crops={crops} currentCrop={currentCrop} />} />

              {/* ✅ frontend-only routes */}
              <Route
                path="/dashboard"
                element={
                  <Dashboard
                    crops={crops}
                    currentCrop={currentCrop}
                    currentCropId={effectiveCurrentCropId}
                    setCurrentCropId={setCurrentCropId}
                    setCrops={setCrops}
                    notes={notes}
                    setNotes={setNotes}
                    tasks={tasks}
                    setTasks={setTasks}
                    irrigation={irrigation}
                    setIrrigation={setIrrigation}
                  />
                }
              />

              <Route
                path="/crops"
                element={
                  <Crops
                    crops={crops}
                    setCrops={setCrops}
                    currentCropId={effectiveCurrentCropId}
                    setCurrentCropId={setCurrentCropId}
                    notes={notes}
                    setNotes={setNotes}
                  />
                }
              />

              <Route path="/learn" element={<Learn />} />
              <Route path="/about" element={<About />} />

              <Route
                path="/library"
                element={
                  <CropLibrary
                    crops={crops}
                    setCrops={setCrops}
                    currentCropId={effectiveCurrentCropId}
                    setCurrentCropId={setCurrentCropId}
                  />
                }
              />

              {/* Authentication is outside the scope of this local-first demo. */}
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />

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
