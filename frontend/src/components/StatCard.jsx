export default function StatCard({ label, value, color }) {
  return (
    <div className="stat-card" style={color ? { background: color } : undefined}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}