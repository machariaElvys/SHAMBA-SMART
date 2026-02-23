import { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ToastProvider } from "./components/ToastProvider";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Crops from "./pages/Crops";
import Learn from "./pages/Learn";
import About from "./pages/About";
import CropLibrary from "./pages/cropLibrary";
import { api } from "./services/api";

const STORAGE_KEY = "shambaSmart.crops.v1";
const STORAGE_CURRENT_KEY = "shambaSmart.currentCropId.v1";

function App() {
  
  //  load crops from localStorage (or start empty)
  const [crops, setCrops] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  //  load current crop id (or null)
  const [currentCropId, setCurrentCropId] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_CURRENT_KEY) || null;
    } catch {
      return null;
    }
  });

  // save crops whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(crops));
  }, [crops]);

  // save currentCropId whenever it changes
  useEffect(() => {
    if (currentCropId) localStorage.setItem(STORAGE_CURRENT_KEY, currentCropId);
    else localStorage.removeItem(STORAGE_CURRENT_KEY);
  }, [currentCropId]);

  //  keep currentCropId valid
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
  api.getCrops()
    .then((data) => {
      const list = data || [];
      setCrops(list);

      setCurrentCropId((prev) => {
        if (prev && list.some((c) => c.id === prev)) return prev;
        return list[0]?.id ?? null;
      });
    })
    .catch(console.error);
}, []);

  return (
    <ToastProvider>
    <div>
      
      <Navbar />

      <main>
        <div className="container">
       <Routes>
          <Route path="/" element={<Home />} />

           <Route
            path="/dashboard"
            element={<Dashboard currentCrop={currentCrop} setCrops={setCrops} />}
          />

          <Route
            path="/crops"
            element={
              <Crops
                crops={crops}
                setCrops={setCrops}
                currentCropId={currentCropId}
                setCurrentCropId={setCurrentCropId}
              />
            }
          />

          <Route path="/learn" element={<Learn />} />
          <Route path="/about" element={<About />} />
          <Route path="/library"
           element={<CropLibrary
              crops={crops}
              setCrops={setCrops}
              currentCropId={currentCropId}
              setCurrentCropId={setCurrentCropId}
            

            />} />
        </Routes>
        </div>
       
      </main>

      <Footer />
    </div>
    </ToastProvider>
  );
}

export default App;

