import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

function statusBadge(status) {
  const map = {
    Scheduled: 'badge-blue',
    'In Progress': 'badge-orange',
    Completed: 'badge-green',
    Cancelled: 'badge-gray',
    Draft: 'badge-gray',
    Sent: 'badge-yellow',
    Paid: 'badge-green',
    Overdue: 'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

export default function Dashboard() {
  const today = dayjs();
  const [overview, setOverview] = useState(null);
  const [todayAppts, setTodayAppts] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    const month = today.format('YYYY-MM');
    Promise.all([
      fetch('/api/stats/overview').then(r => r.json()),
      fetch(`/api/appointments?month=${month}`).then(r => r.json()),
      fetch('/api/invoices').then(r => r.json()),
    ]).then(([ov, appts, inv]) => {
      setOverview(ov);
      setTodayAppts(appts.filter(a => a.date === today.format('YYYY-MM-DD')));
      setRecentInvoices(inv.slice(0, 5));
    });
  }, []);

  const fmt$ = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="page">
      <div className="welcome-bar">
        <div>
          <div className="welcome-title">Welcome back 👋</div>
          <div className="welcome-sub">LaborCo Management — Fayetteville, AR</div>
        </div>
        <div className="welcome-date">
          <div>{today.format('dddd')}</div>
          <strong>{today.format('MMMM D, YYYY')}</strong>
        </div>
      </div>

      {overview && (
        <div className="stat-grid">
          <Link to="/invoices" style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{fmt$(overview.totalRevenue)}</div>
              <div className="stat-meta">From paid invoices</div>
            </div>
          </Link>
          <Link to="/invoices" style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-label">Pending Revenue</div>
              <div className="stat-value">{fmt$(overview.pendingRevenue)}</div>
              <div className="stat-meta">{overview.overdueCount} overdue</div>
            </div>
          </Link>
          <Link to="/clients" style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-label">Total Clients</div>
              <div className="stat-value">{overview.totalClients}</div>
              <div className="stat-meta">In your database</div>
            </div>
          </Link>
          <Link to="/calendar" style={{ textDecoration: 'none' }}>
            <div className="stat-card">
              <div className="stat-label">Appts This Month</div>
              <div className="stat-value">{overview.apptThisMonth}</div>
              <div className="stat-meta">{today.format('MMMM YYYY')}</div>
            </div>
          </Link>
        </div>
      )}

      <div className="dashboard-grid">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div className="card-title">📅 Today's Appointments</div>
              <Link to="/calendar" className="btn btn-sm btn-secondary">View Calendar</Link>
            </div>
            <div className="card-body">
              {todayAppts.length === 0 ? (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <div className="empty-state-sub">No appointments scheduled for today.</div>
                </div>
              ) : (
                todayAppts.map(a => (
                  <div key={a.id} className="appt-item">
                    <div className="appt-time">{a.time} · {a.duration_hours}h · {a.service_type}</div>
                    <div className="appt-title">{a.title}</div>
                    <div className="appt-client">{a.client_name}</div>
                    <div style={{ marginTop: 6 }}>{statusBadge(a.status)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <div className="card-title">💰 Recent Invoices</div>
              <Link to="/invoices" className="btn btn-sm btn-secondary">All Invoices</Link>
            </div>
            <div className="card-body" style={{ padding: '12px 20px' }}>
              {recentInvoices.map(inv => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{inv.invoice_number}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inv.client_name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt$(inv.total)}</div>
                    {statusBadge(inv.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="card">
          <div className="card-header" style={{ marginBottom: 0 }}>
            <div className="card-title">Quick Actions</div>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/clients" className="btn btn-primary">➕ Add Client</Link>
            <Link to="/calendar" className="btn btn-secondary">📅 Schedule Appointment</Link>
            <Link to="/invoices" className="btn btn-secondary">💳 Create Invoice</Link>
            <Link to="/stats" className="btn btn-secondary">📊 View Statistics</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
