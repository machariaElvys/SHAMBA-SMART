import { useState } from "react";
import "../styles/crops.css";
import { useToast } from "../components/ToastProvider";

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
  const { notify } = useToast();

  const [name, setName] = useState("");
  const [stage, setStage] = useState("Seedling");
  const [editingId, setEditingId] = useState(null);
  const [lastRemoved, setLastRemoved] = useState(null);

  // Custom confirm modal state
  const [deleteTarget, setDeleteTarget] = useState(null);



function insertAt(arr, index, item) {
  const next = arr.slice();
  const safe = Math.max(0, Math.min(index, next.length));
  next.splice(safe, 0, item);
  return next;
}

  const addCrop = (e) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      notify("Please enter a crop name.", "warning");
      return;
    }

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

    notify(`Added crop: ${trimmed}.`, "success");

    setName("");
    setStage("Seedling");
    setEditingId(null);
  };

  const updateCrop = (cropId, updater) => {
    setCrops((prev) => prev.map((c) => (c.id === cropId ? updater(c) : c)));
  };

  const setCurrent = (crop) => {
    setCurrentCropId(crop.id);
    notify(`Current crop set to: ${crop.name}.`, "info");
  };

  const toggleEdit = (crop) => {
    const isEditing = editingId === crop.id;

    if (isEditing) {
      setEditingId(null);
      notify(`Saved profile changes for: ${crop.name}.`, "success");
    } else {
      setEditingId(crop.id);
      notify(`Editing profile for: ${crop.name}.`, "info");
    }
  };

  // Open custom confirm modal
  const askRemove = (crop) => {
    setDeleteTarget(crop);
  };

  // Confirm remove
  const confirmRemove = () => {
  if (!deleteTarget) return;

  const cropId = deleteTarget.id;
  const removedIndex = crops.findIndex((c) => c.id === cropId);
  const wasCurrent = cropId === currentCropId;

  setLastRemoved({
    crop: deleteTarget,
    index: removedIndex,
    wasCurrent,
  });

  setCrops((prev) => prev.filter((c) => c.id !== cropId));

  if (wasCurrent) {
    const remaining = crops.filter((c) => c.id !== cropId);
    setCurrentCropId(remaining[0]?.id ?? null);
  }

  if (editingId === cropId) setEditingId(null);

  notify(`Removed crop: ${deleteTarget.name}.`, "info", {
    duration: 5000,
    actionLabel: "Undo",
    onAction: () => {
      setCrops((prev) => insertAt(prev, removedIndex, deleteTarget));
      if (wasCurrent) setCurrentCropId(deleteTarget.id);
      notify(`Restored crop: ${deleteTarget.name}.`, "success");
    },
  });

  setDeleteTarget(null);
};

  // Cancel remove
  const cancelRemove = () => {
    setDeleteTarget(null);
    notify("Removal cancelled.", "info");
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
          Add Crop
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
                <p>
                  Stage: {crop.stage} • Health: {crop.health}/100
                </p>

                <p className="profile-line">
                  Profile: {crop.profileLabel} • Moisture {crop.idealMoisture.min}-
                  {crop.idealMoisture.max}% • Temp {crop.idealTemp.min}-{crop.idealTemp.max}°C
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
                <button className="set-btn" type="button" onClick={() => setCurrent(crop)}>
                  {crop.id === currentCropId ? "Current" : "Set Current"}
                </button>

                <button className="edit-btn" type="button" onClick={() => toggleEdit(crop)}>
                  {isEditing ? "Done" : "Edit Profile"}
                </button>

                <button
                  className="delete-btn"
                  type="button"
                  onClick={() => askRemove(crop)}
                  title="Remove crop"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom confirm modal */}
      {deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h3 className="modal-title">Remove crop</h3>
            <p className="modal-text">
              Are you sure you want to remove "{deleteTarget.name}"?
            </p>

            <div className="modal-actions">
              <button className="btn btn-outline" type="button" onClick={cancelRemove}>
                Cancel
              </button>
              <button className="btn" type="button" onClick={confirmRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Crops;