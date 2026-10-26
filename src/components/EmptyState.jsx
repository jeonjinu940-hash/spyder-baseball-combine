export default function EmptyState({ title, children, actions, icon = '—' }) {
  return (
    <div className="empty glass">
      <div className="icon" aria-hidden="true">{icon}</div>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {actions && <div className="actions">{actions}</div>}
    </div>
  );
}
