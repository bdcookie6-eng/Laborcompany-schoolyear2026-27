const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all clients
router.get('/', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY name ASC').all();
  res.json(clients);
});

// GET single client
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  res.json(client);
});

// GET client appointments
router.get('/:id/appointments', (req, res) => {
  const appts = db.prepare('SELECT * FROM appointments WHERE client_id = ? ORDER BY date DESC, time DESC').all(req.params.id);
  res.json(appts);
});

// GET client invoices
router.get('/:id/invoices', (req, res) => {
  const invoices = db.prepare('SELECT * FROM invoices WHERE client_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(invoices);
});

// POST create client
router.post('/', (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const result = db.prepare('INSERT INTO clients (name, phone, email, address, notes) VALUES (?, ?, ?, ?, ?)').run(name, phone || null, email || null, address || null, notes || null);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

// PUT update client
router.put('/:id', (req, res) => {
  const { name, phone, email, address, notes } = req.body;
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  db.prepare('UPDATE clients SET name=?, phone=?, email=?, address=?, notes=? WHERE id=?').run(
    name || client.name, phone ?? client.phone, email ?? client.email,
    address ?? client.address, notes ?? client.notes, req.params.id
  );
  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE client
router.delete('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
