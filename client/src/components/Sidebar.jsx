import React from 'react';
import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', icon: '⊞', label: 'Dashboard', exact: true },
  { to: '/clients', icon: '👥', label: 'Clients' },
  { to: '/calendar', icon: '📅', label: 'Calendar' },
  { to: '/invoices', icon: '💰', label: 'Invoices' },
  { to: '/stats', icon: '📊', label: 'Statistics' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="company-name">🏡 LaborCo</div>
        <div className="company-sub">Fayetteville, AR</div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {links.map(({ to, icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div>v1.0 · School Year 2026–27</div>
      </div>
    </aside>
  );
}
