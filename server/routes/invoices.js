const express = require('express');
const router = express.Router();
const db = require('../db');

const withClient = `
  SELECT i.*, c.name as client_name, c.email as client_email, c.phone as client_phone, c.address as client_address
  FROM invoices i
  JOIN clients c ON i.client_id = c.id
`;

// GET all invoices, optionally filtered by status
router.get('/', (req, res) => {
  const { status } = req.query;
  let invoices;
  if (status && status !== 'all') {
    invoices = db.prepare(`${withClient} WHERE i.status = ? ORDER BY i.created_at DESC`).all(status);
  } else {
    invoices = db.prepare(`${withClient} ORDER BY i.created_at DESC`).all();
  }
  res.json(invoices);
});

// GET single invoice
router.get('/:id', (req, res) => {
  const invoice = db.prepare(`${withClient} WHERE i.id = ?`).get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  res.json(invoice);
});

// POST create invoice
router.post('/', (req, res) => {
  const { client_id, appointment_id, line_items, tax_rate, due_date } = req.body;
  if (!client_id) return res.status(400).json({ error: 'client_id is required' });

  const items = Array.isArray(line_items) ? line_items : [];
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const rate = parseFloat(tax_rate) || 0;
  const total = subtotal + subtotal * (rate / 100);

  // Generate invoice number
  const lastInvoice = db.prepare("SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1").get();
  let nextNum = 1;
  if (lastInvoice) {
    const match = lastInvoice.invoice_number.match(/(\d+)$/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }
  const invoice_number = `INV-${String(nextNum).padStart(3, '0')}`;

  const result = db.prepare(`
    INSERT INTO invoices (client_id, appointment_id, invoice_number, line_items, subtotal, tax_rate, total, status, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft', ?)
  `).run(client_id, appointment_id || null, invoice_number, JSON.stringify(items), subtotal, rate, total, due_date || null);

  const invoice = db.prepare(`${withClient} WHERE i.id = ?`).get(result.lastInsertRowid);
  res.status(201).json(invoice);
});

// PUT update invoice
router.put('/:id', (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });

  const { client_id, appointment_id, line_items, tax_rate, due_date, status } = req.body;
  const items = Array.isArray(line_items) ? line_items : JSON.parse(inv.line_items || '[]');
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);
  const rate = tax_rate !== undefined ? parseFloat(tax_rate) : inv.tax_rate;
  const total = subtotal + subtotal * (rate / 100);

  db.prepare(`
    UPDATE invoices SET client_id=?, appointment_id=?, line_items=?, subtotal=?, tax_rate=?, total=?, status=?, due_date=?
    WHERE id=?
  `).run(
    client_id ?? inv.client_id,
    appointment_id !== undefined ? appointment_id : inv.appointment_id,
    JSON.stringify(items),
    subtotal, rate, total,
    status ?? inv.status,
    due_date !== undefined ? due_date : inv.due_date,
    req.params.id
  );

  const updated = db.prepare(`${withClient} WHERE i.id = ?`).get(req.params.id);
  res.json(updated);
});

// DELETE invoice
router.delete('/:id', (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST simulate send
router.post('/:id/send', (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const now = new Date().toISOString();
  db.prepare("UPDATE invoices SET status='Sent', sent_at=? WHERE id=?").run(now, req.params.id);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(inv.client_id);
  const updated = db.prepare(`${withClient} WHERE i.id = ?`).get(req.params.id);
  res.json({ invoice: updated, message: `Invoice sent to ${client.email || client.phone || client.name}` });
});

// POST mark as paid
router.post('/:id/mark-paid', (req, res) => {
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const now = new Date().toISOString();
  db.prepare("UPDATE invoices SET status='Paid', paid_at=? WHERE id=?").run(now, req.params.id);
  const updated = db.prepare(`${withClient} WHERE i.id = ?`).get(req.params.id);
  res.json(updated);
});

module.exports = router;
