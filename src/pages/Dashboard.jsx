import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/dashboard.css";
import { fetchCurrentWeather } from "../services/weather";
import { reverseGeocodeLabel } from "../services/geocode";
import { fetchSoilMoisturePercent } from "../services/soilMoisture";
import { journalStorage } from "../services/journalStorage";

const DEFAULT_LOCATION = { label: "Nairobi, Kenya", lat: -1.286389, lon: 36.817223 };

function timeSince(dateValue) {
  if (!dateValue) return "Not logged yet";
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

function Dashboard({ crops, currentCrop, currentCropId, setCurrentCropId, setCrops, notes, tasks, setTasks, irrigation, setIrrigation }) {
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [weather, setWeather] = useState(null);
  const [moisture, setMoisture] = useState(null);
  const [weatherState, setWeatherState] = useState({ loading: true, error: "" });
  const [moistureState, setMoistureState] = useState({ loading: true, error: "" });
  const [locationMessage, setLocationMessage] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCropId, setTaskCropId] = useState(currentCrop?.id || "");
  const [taskDue, setTaskDue] = useState("");

  useEffect(() => {
    if (!crops.some((crop) => crop.id === taskCropId)) setTaskCropId(currentCrop?.id || "");
  }, [crops, currentCrop?.id, taskCropId]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setWeatherState({ loading: true, error: "" });
      try {
        const result = await fetchCurrentWeather(location.lat, location.lon);
        if (!cancelled) setWeather(result);
      } catch {
        if (!cancelled) setWeatherState({ loading: false, error: "Weather data is unavailable right now." });
      } finally {
        if (!cancelled) setWeatherState((state) => ({ ...state, loading: false }));
      }
    };
    load();
    const intervalId = window.setInterval(load, 15 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, [location.lat, location.lon]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setMoistureState({ loading: true, error: "" });
      try {
        const result = await fetchSoilMoisturePercent(location.lat, location.lon);
        if (!cancelled) setMoisture(result);
      } catch {
        if (!cancelled) setMoistureState({ loading: false, error: "Soil moisture estimate is unavailable right now." });
      } finally {
        if (!cancelled) setMoistureState((state) => ({ ...state, loading: false }));
      }
    };
    load();
    const intervalId = window.setInterval(load, 30 * 60 * 1000);
    return () => { cancelled = true; window.clearInterval(intervalId); };
  }, [location.lat, location.lon]);

  const useMyLocation = () => {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      let label = "Your location";
      try { label = await reverseGeocodeLabel(coords.latitude, coords.longitude); } catch { /* Coordinates still work without a place label. */ }
      setLocation({ label, lat: coords.latitude, lon: coords.longitude });
    }, () => setLocationMessage("Location permission was not granted. Showing Nairobi weather."), { timeout: 8000 });
  };

  const activeTasks = useMemo(() => tasks.filter((task) => !task.completed).sort((a, b) => (a.dueDate || "9999").localeCompare(b.dueDate || "9999")), [tasks]);
  const overdueCount = activeTasks.filter((task) => task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10)).length;
  const latestWatering = irrigation.find((item) => item.cropId === currentCrop?.id);
  const cropNotes = notes.filter((item) => item.cropId === currentCrop?.id).slice(0, 3);

  const guideVerified = currentCrop?.guide?.verificationStatus === "verified";
  const condition = !currentCrop
    ? { title: "Waiting for a selected crop", detail: "Choose a crop to view its available source information and field records.", tone: "quiet" }
    : guideVerified
      ? { title: "Guide context available", detail: "Use its crop-specific context alongside a direct field check. The regional soil estimate is not compared with crop thresholds.", tone: "quiet" }
      : { title: "Guide needed", detail: "No verified growing guide is available for this crop yet. Shamba-Smart will not guess its growing conditions.", tone: "quiet" };

  const addTask = (event) => {
    event.preventDefault();
    if (!taskTitle.trim()) return;
    const selected = crops.find((crop) => crop.id === taskCropId);
    const dueDate = event.currentTarget.querySelector("#task-date")?.value || taskDue;
    const task = journalStorage.addTask({ title: taskTitle.trim(), cropId: selected?.id || null, cropName: selected?.name || "All crops", dueDate });
    setTasks((previous) => [task, ...previous]);
    setTaskTitle("");
    setTaskDue("");
  };

  const toggleTask = (task) => {
    setTasks((previous) => previous.map((item) => item.id === task.id ? { ...item, completed: !item.completed, completedAt: task.completed ? null : new Date().toISOString() } : item));
  };

  const logWatering = () => {
    if (!currentCrop) return;
    const event = journalStorage.addIrrigation({ cropId: currentCrop.id, cropName: currentCrop.name, type: "Watering logged", before: moisture?.percent ?? null, after: moisture?.percent ?? null });
    setIrrigation((previous) => [event, ...previous].slice(0, 80));
    setCrops((previous) => previous.map((crop) => crop.id === currentCrop.id ? { ...crop, lastWateredAt: event.createdAt, lastWateredMinutes: 0 } : crop));
  };

  const planFieldCheck = () => {
    if (!currentCrop) return;
    const task = journalStorage.addTask({
      title: `Check field conditions for ${currentCrop.name}`,
      cropId: currentCrop.id,
      cropName: currentCrop.name,
    });
    setTasks((previous) => [task, ...previous]);
  };

  const activity = [
    ...cropNotes.map((item) => ({ id: `note-${item.id}`, date: item.createdAt, label: `${item.category} noted`, detail: item.text, kind: "note" })),
    ...irrigation.filter((item) => item.cropId === currentCrop?.id).slice(0, 3).map((item) => ({ id: `water-${item.id}`, date: item.createdAt, label: "Watering logged", detail: `${item.cropName} · recorded on this device`, kind: "water" })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

  return (
    <div className="dashboard">
      <header className="dashboard-heading">
        <div><p className="eyebrow">FIELD JOURNAL <span> / </span> DAILY VIEW</p><h1>Good farming starts with a closer look.</h1><p>One clear view of the crop you’re tending and the work ahead.</p></div>
        <button className="location-button" type="button" onClick={useMyLocation}><span className="location-pin" aria-hidden="true" />{location.label}<span className="location-action">Update location</span></button>
      </header>

      {!currentCrop ? <section className="dashboard-empty"><span className="empty-field-lines" aria-hidden="true" /><p className="eyebrow">YOUR FIELD, YOUR RECORD</p><h2>Start with the crop in front of you.</h2><p>Add a crop, capture field tasks and make sense of available weather and regional soil information.</p><Link className="button button-primary" to="/crops">Add your first crop <span aria-hidden="true">+</span></Link></section> : <>
        <section className="dashboard-lead">
          <div className="lead-crop">
            <div className="lead-topline"><span className="live-mark" /><label htmlFor="crop-switcher">SELECTED CROP</label><select id="crop-switcher" value={currentCropId} onChange={(event) => setCurrentCropId(event.target.value)} aria-label="Selected crop">{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select></div>
            <h2>{currentCrop.name}</h2>
            <div className="lead-crop-meta"><span>{currentCrop.stage}</span><span>{guideVerified ? "Verified source guide" : "Guide needed"}</span></div>
            <div className="lead-targets"><div><small>FIELD SENSOR THRESHOLD</small><strong>{currentCrop.monitoringTargets?.soilMoisture?.min != null && currentCrop.monitoringTargets?.soilMoisture?.max != null ? `${currentCrop.monitoringTargets.soilMoisture.min}–${currentCrop.monitoringTargets.soilMoisture.max}` : "Not available"}{currentCrop.monitoringTargets?.soilMoisture?.min != null && currentCrop.monitoringTargets?.soilMoisture?.max != null && <i>%</i>}</strong></div><div><small>CROP TEMPERATURE GUIDE</small><strong>{currentCrop.guide?.recommendations?.preferredDayTemperature ? `${currentCrop.guide.recommendations.preferredDayTemperature.min}–${currentCrop.guide.recommendations.preferredDayTemperature.max}` : "Not available"}{currentCrop.guide?.recommendations?.preferredDayTemperature && <i>{currentCrop.guide.recommendations.preferredDayTemperature.unit}</i>}</strong></div></div>
            <Link to="/crops" className="lead-link">Manage crop profile</Link>
          </div>
          <div className="lead-condition">
            <p className="eyebrow">FIELD CHECK</p>
            <div className={`condition-seal ${condition.tone}`}><span className="condition-seal-inner" aria-hidden="true">{condition.tone === "good" ? "✓" : condition.tone === "attention" ? "!" : "·"}</span></div>
            <h3>{condition.title}</h3><p>{condition.detail}</p>
            <div className="condition-sources"><span>REGIONAL SOIL ESTIMATE</span><strong>{moistureState.loading ? "Loading" : moisture ? `${moisture.percent}%` : "Unavailable"}</strong><span>LOCAL AIR TEMPERATURE</span><strong>{weatherState.loading ? "Loading" : typeof weather?.temperature === "number" ? `${weather.temperature}°C` : "Unavailable"}</strong><span>WEATHER</span><strong>{weatherState.loading ? "Loading" : weather?.weather || "Unavailable"}</strong></div>
          </div>
        </section>

        {crops.length > 1 && <section className="field-register-strip"><div className="field-register-label"><span className="eyebrow">FIELD REGISTER</span><strong>{crops.length} crops</strong></div><div className="field-register-list">{crops.map((crop) => <button key={crop.id} type="button" className={crop.id === currentCrop.id ? "plot-selected" : ""} onClick={() => setCurrentCropId(crop.id)}><span>{crop.name}</span><small>{crop.stage}</small></button>)}</div></section>}

        <div className="data-footnote"><span className="footnote-rule" />Weather from Open-Meteo for {location.label}. Soil moisture is a regional model estimate, not a field sensor reading. No threshold comparison or watering decision is based on that estimate.{weatherState.error || moistureState.error ? <span className="source-error"> {weatherState.error || moistureState.error}</span> : null}{locationMessage ? <span className="source-error"> {locationMessage}</span> : null}<button type="button" onClick={useMyLocation}>Use my location</button></div>

        <section className="dashboard-work">
          <div className="work-column task-column">
            <div className="dashboard-section-head"><div><p className="eyebrow">IN THE FIELD</p><h2>Work to do</h2></div><span className="task-count">{activeTasks.length} open <i>{overdueCount ? `· ${overdueCount} overdue` : ""}</i></span></div>
            <form className="task-form" onSubmit={addTask}>
              <label className="sr-only" htmlFor="task-title">New farm task</label><input id="task-title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a task for the field…" />
              <label className="sr-only" htmlFor="task-crop">Crop for task</label><select id="task-crop" value={taskCropId} onChange={(event) => setTaskCropId(event.target.value)}><option value="">All crops</option>{crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}</select>
              <label className="sr-only" htmlFor="task-date">Task due date</label><input id="task-date" type="date" value={taskDue} onChange={(event) => setTaskDue(event.target.value)} />
              <button className="button button-primary" type="submit" disabled={!taskTitle.trim()} aria-label="Add farm task">Add task <span aria-hidden="true">+</span></button>
            </form>
            {activeTasks.length === 0 && tasks.filter((task) => task.completed).length === 0 ? <p className="task-empty">Your task list is clear. Add the next thing you want to do in the field.</p> : <div className="task-list">
              {[...activeTasks, ...tasks.filter((task) => task.completed).slice(0, 2)].slice(0, 6).map((task) => {
                const isOverdue = !task.completed && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
                return <article className={`task-row ${task.completed ? "is-complete" : ""}`} key={task.id}><button className="task-check" type="button" aria-label={task.completed ? `Reopen ${task.title}` : `Complete ${task.title}`} onClick={() => toggleTask(task)}>{task.completed ? "✓" : ""}</button><div className="task-copy"><strong>{task.title}</strong><span>{task.cropName || "All crops"}</span></div><span className={`task-due ${isOverdue ? "is-overdue" : ""}`}>{task.completed ? "Done" : task.dueDate ? new Date(`${task.dueDate}T00:00:00`).toLocaleDateString([], { month: "short", day: "numeric" }) : "No date"}</span><button className="task-remove" type="button" aria-label={`Delete task ${task.title}`} onClick={() => setTasks((previous) => previous.filter((item) => item.id !== task.id))}>×</button></article>;
              })}
            </div>}
          </div>

          <div className="work-column activity-column">
            <div className="dashboard-section-head"><div><p className="eyebrow">RECENT RECORDS</p><h2>Field activity</h2></div><Link to="/crops" className="quiet-link">Add a note</Link></div>
            <div className="watering-summary"><div><span>Last watering logged</span><strong>{timeSince(latestWatering?.createdAt || currentCrop.lastWateredAt)}</strong></div><div className="watering-actions"><button className="button button-secondary" type="button" onClick={logWatering}>Log watering</button><button className="reminder-toggle" type="button" onClick={planFieldCheck}>Plan a field check</button></div></div>
            <p className="activity-explainer">Field checks are added by you as tasks. Shamba-Smart does not trigger them or watering decisions from regional model percentages. Watering logs are stored on this device; no irrigation equipment is connected.</p>
            <div className="activity-list">{activity.length ? activity.map((entry) => <article className={`activity-item ${entry.kind}`} key={entry.id}><span className="activity-marker" /><div><strong>{entry.label}</strong><p>{entry.detail}</p></div><time>{new Date(entry.date).toLocaleDateString([], { month: "short", day: "numeric" })}</time></article>) : <p className="task-empty">Notes and watering logs for {currentCrop.name} will appear here.</p>}</div>
          </div>
        </section>
      </>}
    </div>
  );
}

export default Dashboard;
