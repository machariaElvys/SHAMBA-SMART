import { useState } from "react";
import "../styles/crops.css";

function Crops({ crops, setCrops, currentCropId, setCurrentCropId }) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState("Seedling");

  const addCrop = (e) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return;

    const newCrop = {
      id: crypto.randomUUID(),
      name: trimmed,
      stage,
      health: 75,
      lastWateredMinutes: 0,
      autoWater: false,
    };

    setCrops((prev) => [newCrop, ...prev]);
    setCurrentCropId(newCrop.id); // make it current immediately
    setName("");
    setStage("Seedling");
  };

  return (
    <div className="crops-page">
      <h1>Crops </h1>

      <form className="crop-form" onSubmit={addCrop}>
        <div className="field">
          <label>Crop Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Beans, Tomato, Maize"
          />
        </div>

        <div className="field">
          <label>Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)}>
            <option>Seedling</option>
            <option>Vegetative</option>
            <option>Flowering</option>
            <option>Fruiting</option>
            <option>Harvest</option>
          </select>
        </div>

        <button className="crop-btn" type="submit">Add Crop ➕</button>
      </form>

      <div className="crop-list">
        {crops.map((crop) => (
          <div
            key={crop.id}
            className={`crop-item ${crop.id === currentCropId ? "active" : ""}`}
          >
            <div>
              <h3>{crop.name}</h3>
              <p>Stage: {crop.stage} • Health: {crop.health}/100</p>
            </div>

            <button
              className="set-btn"
              onClick={() => setCurrentCropId(crop.id)}
            >
              {crop.id === currentCropId ? "Current ✅" : "Set Current"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Crops;