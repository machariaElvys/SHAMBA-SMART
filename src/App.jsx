import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Crops from "./pages/Crops";
import Learn from "./pages/Learn";
import About from "./pages/About";

function App() {
  // ✅ All crops live here (single source of truth)
  const [crops, setCrops] = useState([
    {
      id: crypto.randomUUID(),
      name: "Maize",
      stage: "Vegetative",
      health: 78,
      lastWateredMinutes: 180,
      autoWater: false,
    },
  ]);

  // ✅ Which crop is currently shown on Dashboard
  const [currentCropId, setCurrentCropId] = useState(crops[0].id);

  // Helper: get current crop object
  const currentCrop = crops.find((c) => c.id === currentCropId) || crops[0];

  return (
    <div>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/dashboard"
            element={
              <Dashboard
                currentCrop={currentCrop}
                setCurrentCropId={setCurrentCropId}
                crops={crops}
                setCrops={setCrops}
              />
            }
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
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;