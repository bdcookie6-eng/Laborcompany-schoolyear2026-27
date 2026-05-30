import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

function statusBadge(status) {
  const map = {
    Scheduled: 'badge-blue', 'In Progress': 'badge-orange', Completed: 'badge-green',
    Cancelled: 'badge-gray', Draft: 'badge-gray', Sent: 'badge-yellow', Paid: 'badge-green', Overdue: 'badge-red',
  };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

const fmt$ = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${id}`).then(r => r.json()),
      fetch(`/api/clients/${id}/appointments`).then(r => r.json()),
      fetch(`/api/clients/${id}/invoices`).then(r => r.json()),
    ]).then(([c, a, i]) => { setClient(c); setAppointments(a); setInvoices(i); });
  }, [id]);

  if (!client) return <div className="loading">Loading…</div>;

  const initials = client.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const totalPaid = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0);

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <Link to="/clients" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>← Back to Clients</Link>
      </div>

      <div className="client-profile">
        <div className="client-avatar">{initials}</div>
        <div>
          <div className="client-name">{client.name}</div>
          <div className="client-contact">
            {client.phone && <span style={{ marginRight: 16 }}>📞 {client.phone}</span>}
            {client.email && <span style={{ marginRight: 16 }}>✉️ {client.email}</span>}
          </div>
          {client.address && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>📍 {client.address}</div>}
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{fmt$(totalPaid)}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>lifetime revenue</div>
        </div>
      </div>

      {client.notes && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body">
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Notes</div>
            <div style={{ fontSize: 14 }}>{client.notes}</div>
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="card">
          <div className="card-header">
            <div className="card-title">📅 Appointment History</div>
            <Link to="/calendar" className="btn btn-sm btn-secondary">Schedule New</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {appointments.length === 0 ? (
              <div className="empty-state"><div className="empty-state-sub">No appointments yet.</div></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Date</th><th>Service</th><th>Title</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {appointments.map(a => (
                      <tr key={a.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{dayjs(a.date).format('MMM D, YYYY')}</td>
                        <td><span style={{ fontSize: 12 }}>{a.service_type}</span></td>
                        <td>{a.title}</td>
                        <td>{statusBadge(a.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">💰 Invoices</div>
            <Link to="/invoices" className="btn btn-sm btn-secondary">Create Invoice</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {invoices.length === 0 ? (
              <div className="empty-state"><div className="empty-state-sub">No invoices yet.</div></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Invoice</th><th>Total</th><th>Status</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {invoices.map(i => (
                      <tr key={i.id}>
                        <td style={{ fontWeight: 600 }}>{i.invoice_number}</td>
                        <td>{fmt$(i.total)}</td>
                        <td>{statusBadge(i.status)}</td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{dayjs(i.created_at).format('MMM D')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
