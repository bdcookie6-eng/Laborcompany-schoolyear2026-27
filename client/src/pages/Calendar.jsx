import React, { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const SERVICE_TYPES = ['Lawn Care', 'Junk Removal', 'Other'];
const STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Cancelled'];

const dotClass = (type) => type === 'Lawn Care' ? 'lawn' : type === 'Junk Removal' ? 'junk' : 'other';

const emptyForm = { client_id: '', title: '', service_type: 'Lawn Care', date: '', time: '08:00', duration_hours: 2, status: 'Scheduled', notes: '' };

export default function Calendar() {
  const [current, setCurrent] = useState(dayjs().startOf('month'));
  const [selected, setSelected] = useState(dayjs().format('YYYY-MM-DD'));
  const [appointments, setAppointments] = useState([]);
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    fetch(`/api/appointments?month=${current.format('YYYY-MM')}`).then(r => r.json()).then(setAppointments);
  }, [current]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetch('/api/clients').then(r => r.json()).then(setClients); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = (date = selected) => {
    setForm({ ...emptyForm, date });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (a) => {
    setForm({
      client_id: String(a.client_id), title: a.title, service_type: a.service_type,
      date: a.date, time: a.time, duration_hours: a.duration_hours, status: a.status, notes: a.notes || '',
    });
    setEditId(a.id);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.client_id || !form.title || !form.date || !form.time) return;
    const url = editId ? `/api/appointments/${editId}` : '/api/appointments';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, client_id: Number(form.client_id), duration_hours: Number(form.duration_hours) }) });
    setShowModal(false);
    setToast({ message: editId ? 'Appointment updated.' : 'Appointment scheduled.', type: 'success' });
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this appointment?')) return;
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    setToast({ message: 'Appointment deleted.', type: '' });
    load();
  };

  // Build calendar grid
  const startOfGrid = current.startOf('week');
  const endOfMonth = current.endOf('month');
  const endOfGrid = endOfMonth.endOf('week');
  const days = [];
  let d = startOfGrid;
  while (d.isBefore(endOfGrid) || d.isSame(endOfGrid, 'day')) {
    days.push(d);
    d = d.add(1, 'day');
  }

  const apptsByDate = {};
  appointments.forEach(a => {
    if (!apptsByDate[a.date]) apptsByDate[a.date] = [];
    apptsByDate[a.date].push(a);
  });

  const selectedAppts = apptsByDate[selected] || [];
  const today = dayjs().format('YYYY-MM-DD');

  const fmtTime = (t) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  function statusBadge(status) {
    const map = { Scheduled: 'badge-blue', 'In Progress': 'badge-orange', Completed: 'badge-green', Cancelled: 'badge-gray' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Calendar</div>
          <div className="page-subtitle">Schedule and manage appointments</div>
        </div>
        <button className="btn btn-primary" onClick={() => openAdd()}>➕ Add Appointment</button>
      </div>

      <div className="calendar-layout">
        <div className="card">
          <div className="card-body">
            <div className="calendar-nav">
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(c => c.subtract(1, 'month'))}>‹ Prev</button>
              <div className="calendar-month">{current.format('MMMM YYYY')}</div>
              <button className="btn btn-secondary btn-sm" onClick={() => setCurrent(c => c.add(1, 'month'))}>Next ›</button>
            </div>

            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="cal-day-header">{d}</div>
              ))}
              {days.map(day => {
                const key = day.format('YYYY-MM-DD');
                const dayAppts = apptsByDate[key] || [];
                const isOther = !day.isSame(current, 'month');
                const isToday = key === today;
                const isSel = key === selected;
                return (
                  <div
                    key={key}
                    className={`cal-cell${isOther ? ' other-month' : ''}${isToday ? ' today' : ''}${isSel ? ' selected' : ''}`}
                    onClick={() => { setSelected(key); }}
                    onDoubleClick={() => openAdd(key)}
                  >
                    <div className="cal-date">{isToday ? <span>{day.date()}</span> : day.date()}</div>
                    {dayAppts.slice(0, 2).map(a => (
                      <div key={a.id} className={`cal-dot ${dotClass(a.service_type)}`}>
                        {fmtTime(a.time)} {a.title}
                      </div>
                    ))}
                    {dayAppts.length > 2 && <div style={{ fontSize: 10, color: 'var(--text-muted)', paddingLeft: 4 }}>+{dayAppts.length - 2} more</div>}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              <span><span className="cal-dot lawn" style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 4, marginRight: 4 }}>●</span>Lawn Care</span>
              <span><span className="cal-dot junk" style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 4, marginRight: 4 }}>●</span>Junk Removal</span>
              <span><span className="cal-dot other" style={{ display: 'inline-flex', padding: '1px 6px', borderRadius: 4, marginRight: 4 }}>●</span>Other</span>
              <span style={{ marginLeft: 'auto' }}>Double-click a date to add appointment</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ position: 'sticky', top: 24 }}>
          <div className="card-body">
            <div className="day-panel-title">
              {dayjs(selected).format('dddd, MMMM D')}
            </div>
            {selectedAppts.length === 0 ? (
              <div className="empty-state" style={{ padding: '20px 0' }}>
                <div className="empty-state-sub">No appointments this day.</div>
                <button className="btn btn-sm btn-primary" style={{ marginTop: 12 }} onClick={() => openAdd(selected)}>Schedule One</button>
              </div>
            ) : (
              selectedAppts.map(a => (
                <div key={a.id} className="appt-item">
                  <div className="appt-time">{fmtTime(a.time)} · {a.duration_hours}h · {a.service_type}</div>
                  <div className="appt-title">{a.title}</div>
                  <div className="appt-client">{a.client_name}</div>
                  {a.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{a.notes}</div>}
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {statusBadge(a.status)}
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(a)}>✏️</button>
                    <button className="btn btn-sm btn-danger" onClick={() => del(a.id)}>🗑</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal
          title={editId ? 'Edit Appointment' : 'Schedule Appointment'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.client_id || !form.title || !form.date || !form.time}>
                {editId ? 'Save Changes' : 'Schedule'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Client *</label>
            <select value={form.client_id} onChange={e => set('client_id', e.target.value)}>
              <option value="">— Select a client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Monthly Lawn Mowing" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Service Type</label>
              <select value={form.service_type} onChange={e => set('service_type', e.target.value)}>
                {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Time *</label>
              <input type="time" value={form.time} onChange={e => set('time', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Duration (hours)</label>
            <input type="number" min="0.5" max="12" step="0.5" value={form.duration_hours} onChange={e => set('duration_hours', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any special instructions…" />
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
