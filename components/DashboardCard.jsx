export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  type,
  trend,
}) {
  return (
    <div className="dashboard-card">

      <div className={`card-icon ${type}`}>
        {icon}
      </div>

      <div className="card-content">

        <p>
          {title}
        </p>

        <h3>
          {value}
        </h3>

        <div className="card-bottom">

          <span className="card-subtitle">
            {subtitle}
          </span>

          {trend && (
            <span className="card-trend">
              {trend}
            </span>
          )}

        </div>

      </div>

    </div>
  );
}