import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';

const fmt$ = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SERVICE_COLORS = {
  'Lawn Care': '#22c55e',
  'Junk Removal': '#ef4444',
  'Other': '#3b82f6',
};

export default function Stats() {
  const [overview, setOverview] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/stats/overview').then(r => r.json()),
      fetch('/api/stats/monthly-revenue').then(r => r.json()),
      fetch('/api/stats/service-breakdown').then(r => r.json()),
      fetch('/api/stats/recent-activity').then(r => r.json()),
    ]).then(([ov, mr, sb, ra]) => {
      setOverview(ov);
      setMonthlyRevenue(mr);
      setBreakdown(sb);
      setActivity(ra);
    });
  }, []);

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue), 1);
  const totalAppts = breakdown.reduce((s, b) => s + b.count, 0) || 1;

  const statusBadge = (type, status) => {
    if (type === 'appointment') {
      const m = { Scheduled: 'badge-blue', 'In Progress': 'badge-yellow', Completed: 'badge-green', Cancelled: 'badge-gray' };
      return <span className={`badge ${m[status] || 'badge-gray'}`}>{status}</span>;
    }
    const m = { Draft: 'badge-gray', Sent: 'badge-yellow', Paid: 'badge-green', Overdue: 'badge-red' };
    return <span className={`badge ${m[status] || 'badge-gray'}`}>{status}</span>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Statistics</div>
          <div className="page-subtitle">Business performance overview</div>
        </div>
      </div>

      {overview && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value" style={{ color: '#166534' }}>{fmt$(overview.totalRevenue)}</div>
            <div className="stat-meta">From paid invoices</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Revenue</div>
            <div className="stat-value" style={{ color: '#854d0e' }}>{fmt$(overview.pendingRevenue)}</div>
            <div className="stat-meta">{overview.overdueCount} overdue invoice{overview.overdueCount !== 1 ? 's' : ''}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Clients</div>
            <div className="stat-value">{overview.totalClients}</div>
            <div className="stat-meta">Active accounts</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Appts This Month</div>
            <div className="stat-value">{overview.apptThisMonth}</div>
            <div className="stat-meta">{dayjs().format('MMMM YYYY')}</div>
          </div>
        </div>
      )}

      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Monthly Revenue (Last 6 Months)</div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <div className="bar-chart">
              {monthlyRevenue.map(m => {
                const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                const label = dayjs(m.month + '-01').format('MMM');
                return (
                  <div key={m.month} className="bar-col">
                    <div className="bar-value">{m.revenue > 0 ? fmt$(m.revenue) : ''}</div>
                    <div
                      className="bar"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      title={`${label}: ${fmt$(m.revenue)}`}
                    />
                    <div className="bar-label">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Service Breakdown</div>
          </div>
          <div className="card-body" style={{ paddingTop: 8 }}>
            <div className="pie-chart">
              {breakdown.map(b => {
                const pct = Math.round((b.count / totalAppts) * 100);
                return (
                  <div key={b.service_type} className="pie-row">
                    <div className="pie-label">
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: SERVICE_COLORS[b.service_type] || '#94a3b8', marginRight: 6 }} />
                      {b.service_type}
                    </div>
                    <div className="pie-bar-track">
                      <div
                        className="pie-bar-fill"
                        style={{ width: `${pct}%`, background: SERVICE_COLORS[b.service_type] || '#94a3b8' }}
                      />
                    </div>
                    <div className="pie-count">{b.count} ({pct}%)</div>
                  </div>
                );
              })}
              {breakdown.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Activity</div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {activity.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No recent activity.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((item, i) => (
                  <tr key={i}>
                    <td>
                      <span className={`badge ${item.type === 'appointment' ? 'badge-blue' : 'badge-gray'}`}>
                        {item.type === 'appointment' ? 'Appt' : 'Invoice'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {item.type === 'appointment' ? item.title : item.invoice_number}
                    </td>
                    <td>{item.client_name}</td>
                    <td>{statusBadge(item.type, item.status)}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {dayjs(item.created_at || item.date).format('MMM D, YYYY')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
