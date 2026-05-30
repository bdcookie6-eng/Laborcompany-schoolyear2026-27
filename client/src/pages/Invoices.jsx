import React, { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const fmt$ = (n) => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUSES = ['all', 'Draft', 'Sent', 'Paid', 'Overdue'];

function statusBadge(status) {
  const map = { Draft: 'badge-gray', Sent: 'badge-yellow', Paid: 'badge-green', Overdue: 'badge-red' };
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
}

const emptyForm = {
  client_id: '',
  appointment_id: '',
  line_items: [{ description: '', price: '' }],
  tax_rate: 0,
  due_date: '',
};

function InvoicePreview({ invoice }) {
  if (!invoice) return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>
        Select an invoice to preview
      </div>
    </div>
  );

  const items = JSON.parse(invoice.line_items || '[]');
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const tax = subtotal * (invoice.tax_rate / 100);

  return (
    <div className="invoice-preview">
      <div className="inv-header">
        <div>
          <div className="company-name" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 18 }}>LaborCo</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Fayetteville, AR</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>laborco.fayetteville@gmail.com</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="inv-title">INVOICE</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{invoice.invoice_number}</div>
          {statusBadge(invoice.status)}
        </div>
      </div>

      <div className="inv-meta">
        <div>
          <div className="inv-meta-label">Bill To</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{invoice.client_name}</div>
          {invoice.client_email && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{invoice.client_email}</div>}
          {invoice.client_phone && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{invoice.client_phone}</div>}
          {invoice.client_address && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{invoice.client_address}</div>}
        </div>
        <div>
          <div className="inv-meta-label">Invoice Date</div>
          <div style={{ fontSize: 13 }}>{dayjs(invoice.created_at).format('MMMM D, YYYY')}</div>
          {invoice.due_date && (
            <>
              <div className="inv-meta-label" style={{ marginTop: 10 }}>Due Date</div>
              <div style={{ fontSize: 13 }}>{dayjs(invoice.due_date).format('MMMM D, YYYY')}</div>
            </>
          )}
        </div>
      </div>

      <table style={{ marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={{ width: '70%' }}>Description</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.description}</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt$(item.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="inv-totals">
        <div className="inv-totals-row">
          <span>Subtotal</span>
          <span>{fmt$(subtotal)}</span>
        </div>
        {invoice.tax_rate > 0 && (
          <div className="inv-totals-row">
            <span>Tax ({invoice.tax_rate}%)</span>
            <span>{fmt$(tax)}</span>
          </div>
        )}
        <div className="inv-totals-row total-row">
          <span>Total</span>
          <span>{fmt$(invoice.total)}</span>
        </div>
      </div>

      {invoice.sent_at && (
        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          Sent: {dayjs(invoice.sent_at).format('MMM D, YYYY h:mm A')}
          {invoice.paid_at && ` · Paid: ${dayjs(invoice.paid_at).format('MMM D, YYYY')}`}
        </div>
      )}
    </div>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    const qs = filter !== 'all' ? `?status=${filter}` : '';
    fetch(`/api/invoices${qs}`).then(r => r.json()).then(data => {
      setInvoices(data);
      if (selected) {
        const updated = data.find(i => i.id === selected.id);
        setSelected(updated || null);
      }
    });
  }, [filter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(setClients);
    fetch('/api/appointments').then(r => r.json()).then(setAppointments);
  }, []);

  const clientAppts = appointments.filter(a => String(a.client_id) === String(form.client_id));

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const updateLineItem = (idx, field, val) => {
    setForm(f => {
      const items = [...f.line_items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...f, line_items: items };
    });
  };

  const addLineItem = () => setForm(f => ({ ...f, line_items: [...f.line_items, { description: '', price: '' }] }));
  const removeLineItem = (idx) => setForm(f => ({ ...f, line_items: f.line_items.filter((_, i) => i !== idx) }));

  const subtotal = form.line_items.reduce((s, i) => s + (parseFloat(i.price) || 0), 0);
  const total = subtotal + subtotal * (parseFloat(form.tax_rate) / 100);

  const openCreate = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.client_id) return;
    const body = {
      client_id: Number(form.client_id),
      appointment_id: form.appointment_id ? Number(form.appointment_id) : null,
      line_items: form.line_items.filter(i => i.description),
      tax_rate: parseFloat(form.tax_rate) || 0,
      due_date: form.due_date || null,
    };
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const inv = await res.json();
    setShowModal(false);
    setToast({ message: 'Invoice created.', type: 'success' });
    setSelected(inv);
    load();
  };

  const del = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
    if (selected?.id === id) setSelected(null);
    setToast({ message: 'Invoice deleted.', type: '' });
    load();
  };

  const sendInvoice = async (inv) => {
    const res = await fetch(`/api/invoices/${inv.id}/send`, { method: 'POST' });
    const { message } = await res.json();
    setToast({ message, type: 'success' });
    load();
  };

  const markPaid = async (inv) => {
    await fetch(`/api/invoices/${inv.id}/mark-paid`, { method: 'POST' });
    setToast({ message: 'Invoice marked as paid.', type: 'success' });
    load();
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-subtitle">{invoices.length} invoices</div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Invoice</button>
      </div>

      <div className="invoice-layout">
        <div>
          <div className="filter-bar">
            {STATUSES.map(s => (
              <button
                key={s}
                className={`filter-btn${filter === s ? ' active' : ''}`}
                onClick={() => setFilter(s)}
              >
                {s === 'all' ? 'All' : s}
              </button>
            ))}
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Due</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 && (
                  <tr><td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-icon">💰</div>
                      <p>No invoices found.</p>
                    </div>
                  </td></tr>
                )}
                {invoices.map(inv => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelected(inv)}
                    style={{ background: selected?.id === inv.id ? '#eff6ff' : undefined }}
                  >
                    <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                    <td>{inv.client_name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{dayjs(inv.created_at).format('MMM D, YYYY')}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{inv.due_date ? dayjs(inv.due_date).format('MMM D') : '—'}</td>
                    <td style={{ fontWeight: 600 }}>{fmt$(inv.total)}</td>
                    <td>{statusBadge(inv.status)}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {inv.status === 'Draft' && (
                          <button className="btn btn-sm btn-secondary" onClick={() => sendInvoice(inv)}>Send</button>
                        )}
                        {(inv.status === 'Sent' || inv.status === 'Overdue') && (
                          <button className="btn btn-sm btn-primary" onClick={() => markPaid(inv)}>Mark Paid</button>
                        )}
                        <button className="btn btn-sm btn-danger" onClick={() => del(inv.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          {selected && (
            <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selected.status === 'Draft' && (
                <button className="btn btn-primary btn-sm" onClick={() => sendInvoice(selected)}>
                  Send Invoice
                </button>
              )}
              {(selected.status === 'Sent' || selected.status === 'Overdue') && (
                <button className="btn btn-primary btn-sm" onClick={() => markPaid(selected)}>
                  Mark as Paid
                </button>
              )}
              <button className="btn btn-danger btn-sm" onClick={() => del(selected.id)}>Delete</button>
            </div>
          )}
          <InvoicePreview invoice={selected} />
        </div>
      </div>

      {showModal && (
        <Modal
          title="Create Invoice"
          size="lg"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={!form.client_id}>Create Invoice</button>
            </>
          }
        >
          <div className="form-group">
            <label>Client *</label>
            <select className="form-control" value={form.client_id} onChange={e => setF('client_id', e.target.value)}>
              <option value="">— Select a client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {form.client_id && (
            <div className="form-group">
              <label>Link to Appointment (optional)</label>
              <select className="form-control" value={form.appointment_id} onChange={e => setF('appointment_id', e.target.value)}>
                <option value="">— None —</option>
                {clientAppts.map(a => (
                  <option key={a.id} value={a.id}>{dayjs(a.date).format('MMM D')} — {a.title}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Line Items</label>
            <div className="line-items-list">
              {form.line_items.map((item, idx) => (
                <div key={idx} className="line-item-row">
                  <input
                    className="form-control"
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateLineItem(idx, 'description', e.target.value)}
                  />
                  <input
                    className="form-control"
                    placeholder="Price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={e => updateLineItem(idx, 'price', e.target.value)}
                  />
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeLineItem(idx)}
                    style={{ color: '#dc2626', padding: '4px 8px' }}
                    disabled={form.line_items.length === 1}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={addLineItem}>+ Add Line Item</button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tax Rate (%)</label>
              <input
                className="form-control"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.tax_rate}
                onChange={e => setF('tax_rate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Due Date</label>
              <input
                className="form-control"
                type="date"
                value={form.due_date}
                onChange={e => setF('due_date', e.target.value)}
              />
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 16px', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Subtotal</span><span>{fmt$(subtotal)}</span>
            </div>
            {parseFloat(form.tax_rate) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Tax ({form.tax_rate}%)</span>
                <span>{fmt$(subtotal * parseFloat(form.tax_rate) / 100)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span>Total</span><span>{fmt$(total)}</span>
            </div>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
