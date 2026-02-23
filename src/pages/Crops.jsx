import { useState } from "react";
import "../styles/crops.css";
import { useToast } from "../components/ToastProvider";
import { api } from "../services/api";

// Preset profiles
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

function insertAt(arr, index, item) {
  const next = arr.slice();
  const safe = Math.max(0, Math.min(index, next.length));
  next.splice(safe, 0, item);
  return next;
}

function Crops({ crops, setCrops, currentCropId, setCurrentCropId }) {
  const { notify } = useToast();

  const [name, setName] = useState("");
  const [stage, setStage] = useState("Seedling");
  const [editingId, setEditingId] = useState(null);

  // confirm modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  const addCrop = async (e) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      notify("Please enter a crop name.", "warning");
      return;
    }

    const profile = getProfileForName(trimmed);

    const payload = {
      name: trimmed,
      stage,
      health: 75,
      lastWateredMinutes: 0,
      autoWater: false,
      profileLabel: profile.label,
      idealMoisture: profile.idealMoisture,
      idealTemp: profile.idealTemp,
    };

    try {
      const saved = await api.createCrop(payload);

      setCrops((prev) => [saved, ...prev]);
      setCurrentCropId(saved.id);

      notify(`Added crop: ${saved.name}.`, "success");

      setName("");
      setStage("Seedling");
      setEditingId(null);
    } catch (err) {
      notify(err.message || "Failed to add crop.", "error");
    }
  };

  const updateCrop = (cropId, updater) => {
    setCrops((prev) => prev.map((c) => (c.id === cropId ? updater(c) : c)));
  };

  const setCurrent = (crop) => {
    setCurrentCropId(crop.id);
    notify(`Current crop set to: ${crop.name}.`, "info");
  };

  const toggleEdit = async (crop) => {
    const isEditing = editingId === crop.id;

    if (isEditing) {
      setEditingId(null);

      try {
        await api.updateCrop(crop.id, {
          profileLabel: crop.profileLabel,
          idealMoisture: crop.idealMoisture,
          idealTemp: crop.idealTemp,
        });

        notify(`Saved profile changes for: ${crop.name}.`, "success");
      } catch (err) {
        notify(err.message || "Failed to save changes.", "error");
      }
    } else {
      setEditingId(crop.id);
      notify(`Editing profile for: ${crop.name}.`, "info");
    }
  };

  const askRemove = (crop) => {
    setDeleteTarget(crop);
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;

    const cropId = deleteTarget.id;
    const removedIndex = crops.findIndex((c) => c.id === cropId);
    const wasCurrent = cropId === currentCropId;

    try {
      await api.deleteCrop(cropId);

      setCrops((prev) => {
        const next = prev.filter((c) => c.id !== cropId);
        if (wasCurrent) setCurrentCropId(next[0]?.id ?? null);
        return next;
      });

      if (editingId === cropId) setEditingId(null);

      notify(`Removed crop: ${deleteTarget.name}.`, "info", {
        duration: 5000,
        actionLabel: "Undo",
        onAction: async () => {
          try {
            const recreated = await api.createCrop({
              name: deleteTarget.name,
              stage: deleteTarget.stage,
              health: deleteTarget.health ?? 75,
              lastWateredMinutes: 0,
              autoWater: deleteTarget.autoWater ?? false,
              profileLabel: deleteTarget.profileLabel,
              idealMoisture: deleteTarget.idealMoisture,
              idealTemp: deleteTarget.idealTemp,
            });

            setCrops((prev) => insertAt(prev, removedIndex, recreated));
            if (wasCurrent) setCurrentCropId(recreated.id);

            notify(`Restored crop: ${recreated.name}.`, "success");
          } catch (err) {
            notify(err.message || "Failed to undo removal.", "error");
          }
        },
      });
    } catch (err) {
      notify(err.message || "Failed to remove crop.", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

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