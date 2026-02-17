import "../styles/dashboard.css";

function StatCard({ title, value, icon }) {
  return (
    <div className="stat-card">
      <span className="icon">{icon}</span>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

export default StatCard;