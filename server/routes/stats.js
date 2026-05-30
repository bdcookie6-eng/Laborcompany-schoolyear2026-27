const express = require('express');
const router = express.Router();
const db = require('../db');

// GET overview stats
router.get('/overview', (req, res) => {
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as val FROM invoices WHERE status = 'Paid'").get().val;
  const pendingRevenue = db.prepare("SELECT COALESCE(SUM(total), 0) as val FROM invoices WHERE status IN ('Sent', 'Draft')").get().val;
  const totalClients = db.prepare("SELECT COUNT(*) as val FROM clients").get().val;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const apptThisMonth = db.prepare("SELECT COUNT(*) as val FROM appointments WHERE strftime('%Y-%m', date) = ?").get(currentMonth).val;
  const overdueCount = db.prepare("SELECT COUNT(*) as val FROM invoices WHERE status = 'Overdue'").get().val;

  res.json({ totalRevenue, pendingRevenue, totalClients, apptThisMonth, overdueCount });
});

// GET monthly revenue last 6 months
router.get('/monthly-revenue', (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', paid_at) as month, SUM(total) as revenue
    FROM invoices
    WHERE status = 'Paid' AND paid_at IS NOT NULL
    AND paid_at >= date('now', '-6 months')
    GROUP BY month
    ORDER BY month ASC
  `).all();

  // Fill in missing months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    const found = rows.find(r => r.month === key);
    months.push({ month: key, revenue: found ? found.revenue : 0 });
  }
  res.json(months);
});

// GET service type breakdown
router.get('/service-breakdown', (req, res) => {
  const rows = db.prepare(`
    SELECT service_type, COUNT(*) as count
    FROM appointments
    GROUP BY service_type
  `).all();
  res.json(rows);
});

// GET recent activity
router.get('/recent-activity', (req, res) => {
  const recentAppts = db.prepare(`
    SELECT a.id, a.title, a.date, a.status, a.service_type, c.name as client_name, 'appointment' as type
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    ORDER BY a.created_at DESC
    LIMIT 5
  `).all();

  const recentInvoices = db.prepare(`
    SELECT i.id, i.invoice_number, i.total, i.status, i.created_at, c.name as client_name, 'invoice' as type
    FROM invoices i
    JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
    LIMIT 5
  `).all();

  const combined = [...recentAppts, ...recentInvoices]
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
    .slice(0, 10);

  res.json(combined);
});

module.exports = router;
