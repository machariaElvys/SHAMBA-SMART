import { useState } from "react";
import "../styles/crops.css";

// Preset profiles (expand anytime)
const CROP_PROFILES = {
  maize: {
    label: "Recommended (Maize)",
    idealMoisture: { min: 60, max: 75 },
    idealTemp: { min: 26, max: 32 },
  },
  tomato: {
    label: "Recommended (Tomato)",
    idealMoisture: { min: 55, max: 70 },
    idealTemp: { min: 22, max: 30 },
  },
  beans: {
    label: "Recommended (Beans)",
    idealMoisture: { min: 50, max: 65 },
    idealTemp: { min: 18, max: 28 },
  },
  sukuma: {
    label: "Recommended (Sukuma wiki)",
    idealMoisture: { min: 55, max: 70 },
    idealTemp: { min: 18, max: 28 },
  },
};

const DEFAULT_PROFILE = {
  label: "Generic profile",
  idealMoisture: { min: 55, max: 70 },
  idealTemp: { min: 24, max: 32 },
};

function getProfileForName(name) {
  const key = name.trim().toLowerCase();
  return CROP_PROFILES[key] ?? DEFAULT_PROFILE;
}

function Crops({ crops, setCrops, currentCropId, setCurrentCropId }) {
  const [name, setName] = useState("");
  const [stage, setStage] = useState("Seedling");
  const [editingId, setEditingId] = useState(null);

  const addCrop = (e) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return;

    const profile = getProfileForName(trimmed);

    const newCrop = {
      id: crypto.randomUUID(),
      name: trimmed,
      stage,
      health: 75,
      lastWateredMinutes: 0,
      autoWater: false,

      profileLabel: profile.label,
      idealMoisture: profile.idealMoisture,
      idealTemp: profile.idealTemp,
    };

    setCrops((prev) => [newCrop, ...prev]);
    setCurrentCropId(newCrop.id);
    setName("");
    setStage("Seedling");
    setEditingId(null);
  };

  const updateCrop = (cropId, updater) => {
    setCrops((prev) => prev.map((c) => (c.id === cropId ? updater(c) : c)));
  };

  const removeCrop = (cropId) => {
    // optional: confirm delete
    const ok = window.confirm("Remove this crop?");
    if (!ok) return;

    setCrops((prev) => {
      const next = prev.filter((c) => c.id !== cropId);

      // if the removed crop was current, pick a new current
      if (cropId === currentCropId) {
        const newCurrent = next[0]?.id ?? null;
        setCurrentCropId(newCurrent);
      }

      return next;
    });

    if (editingId === cropId) setEditingId(null);
  };

  return (
    <div className="crops-page">
      <h1>Crops</h1>

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

        <button className="crop-btn" type="submit">
          Add Crop ➕
        </button>
      </form>

      <div className="crop-list">
        {crops.map((crop) => {
          const isEditing = editingId === crop.id;

          return (
            <div
              key={crop.id}
              className={`crop-item ${crop.id === currentCropId ? "active" : ""}`}
            >
              <div className="crop-info">
                <h3>{crop.name}</h3>
                <p>Stage: {crop.stage} • Health: {crop.health}/100</p>

                <p className="profile-line">
                  Profile: {crop.profileLabel} • Moisture {crop.idealMoisture.min}-{crop.idealMoisture.max}% • Temp{" "}
                  {crop.idealTemp.min}-{crop.idealTemp.max}°C
                </p>

                {isEditing && (
                  <div className="profile-edit">
                    <div>
                      <label>Moisture Min</label>
                      <input
                        type="number"
                        value={crop.idealMoisture.min}
                        onChange={(e) =>
                          updateCrop(crop.id, (c) => ({
                            ...c,
                            profileLabel: "Custom profile",
                            idealMoisture: {
                              ...c.idealMoisture,
                              min: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label>Moisture Max</label>
                      <input
                        type="number"
                        value={crop.idealMoisture.max}
                        onChange={(e) =>
                          updateCrop(crop.id, (c) => ({
                            ...c,
                            profileLabel: "Custom profile",
                            idealMoisture: {
                              ...c.idealMoisture,
                              max: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label>Temp Min</label>
                      <input
                        type="number"
                        value={crop.idealTemp.min}
                        onChange={(e) =>
                          updateCrop(crop.id, (c) => ({
                            ...c,
                            profileLabel: "Custom profile",
                            idealTemp: {
                              ...c.idealTemp,
                              min: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label>Temp Max</label>
                      <input
                        type="number"
                        value={crop.idealTemp.max}
                        onChange={(e) =>
                          updateCrop(crop.id, (c) => ({
                            ...c,
                            profileLabel: "Custom profile",
                            idealTemp: {
                              ...c.idealTemp,
                              max: Number(e.target.value),
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="crop-actions">
                <button className="set-btn" onClick={() => setCurrentCropId(crop.id)}>
                  {crop.id === currentCropId ? "Current ✅" : "Set Current"}
                </button>

                <button
                  className="edit-btn"
                  onClick={() => setEditingId(isEditing ? null : crop.id)}
                >
                  {isEditing ? "Done" : "Edit Profile"}
                </button>

                <button
                  className="delete-btn"
                  onClick={() => removeCrop(crop.id)}
                  title="Remove crop"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Crops;

