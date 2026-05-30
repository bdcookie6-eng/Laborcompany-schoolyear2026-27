import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import dayjs from 'dayjs';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = () => fetch('/api/clients').then(r => r.json()).then(setClients);
  useEffect(() => { load(); }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', notes: c.notes || '' }); setEditId(c.id); setShowModal(true); };

  const save = async () => {
    if (!form.name.trim()) return;
    const url = editId ? `/api/clients/${editId}` : '/api/clients';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false);
    setToast({ message: editId ? 'Client updated.' : 'Client added.', type: 'success' });
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this client? All their appointments and invoices will also be removed.')) return;
    await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    setToast({ message: 'Client deleted.', type: '' });
    load();
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Clients</div>
          <div className="page-subtitle">{clients.length} total clients</div>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Add Client</button>
      </div>

      <div className="card">
        <div className="card-body">
          <div className="search-bar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input placeholder="Search by name, phone, or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Address</th>
                  <th>Since</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-sub">No clients found.</div></div></td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td><Link to={`/clients/${c.id}`} className="table-link">{c.name}</Link></td>
                    <td>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{c.email || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.address || '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{dayjs(c.created_at).format('MMM D, YYYY')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => del(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <Modal
          title={editId ? 'Edit Client' : 'Add New Client'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.name.trim()}>
                {editId ? 'Save Changes' : 'Add Client'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label>Full Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="479-555-0000" />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" type="email" />
            </div>
          </div>
          <div className="form-group">
            <label>Address</label>
            <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, Fayetteville, AR 72701" />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Gate code, special instructions, referral source…" />
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
