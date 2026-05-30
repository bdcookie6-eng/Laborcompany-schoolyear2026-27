const express = require('express');
const router = express.Router();
const db = require('../db');

// GET appointments, optionally filtered by month (YYYY-MM)
router.get('/', (req, res) => {
  const { month } = req.query;
  let appts;
  if (month) {
    appts = db.prepare(`
      SELECT a.*, c.name as client_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      WHERE strftime('%Y-%m', a.date) = ?
      ORDER BY a.date ASC, a.time ASC
    `).all(month);
  } else {
    appts = db.prepare(`
      SELECT a.*, c.name as client_name
      FROM appointments a
      JOIN clients c ON a.client_id = c.id
      ORDER BY a.date DESC, a.time DESC
    `).all();
  }
  res.json(appts);
});

// POST create appointment
router.post('/', (req, res) => {
  const { client_id, title, service_type, date, time, duration_hours, status, notes } = req.body;
  if (!client_id || !title || !date || !time) {
    return res.status(400).json({ error: 'client_id, title, date, and time are required' });
  }
  const result = db.prepare(`
    INSERT INTO appointments (client_id, title, service_type, date, time, duration_hours, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(client_id, title, service_type || 'Other', date, time, duration_hours || 1, status || 'Scheduled', notes || null);

  const appt = db.prepare(`
    SELECT a.*, c.name as client_name
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    WHERE a.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(appt);
});

// PUT update appointment
router.put('/:id', (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });

  const { client_id, title, service_type, date, time, duration_hours, status, notes } = req.body;
  db.prepare(`
    UPDATE appointments SET client_id=?, title=?, service_type=?, date=?, time=?, duration_hours=?, status=?, notes=?
    WHERE id=?
  `).run(
    client_id ?? appt.client_id,
    title ?? appt.title,
    service_type ?? appt.service_type,
    date ?? appt.date,
    time ?? appt.time,
    duration_hours ?? appt.duration_hours,
    status ?? appt.status,
    notes !== undefined ? notes : appt.notes,
    req.params.id
  );

  const updated = db.prepare(`
    SELECT a.*, c.name as client_name
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    WHERE a.id = ?
  `).get(req.params.id);
  res.json(updated);
});

// DELETE appointment
router.delete('/:id', (req, res) => {
  const appt = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  if (!appt) return res.status(404).json({ error: 'Appointment not found' });
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
