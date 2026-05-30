const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'laborcompany.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    service_type TEXT NOT NULL DEFAULT 'Other',
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration_hours REAL DEFAULT 1,
    status TEXT DEFAULT 'Scheduled',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    appointment_id INTEGER,
    invoice_number TEXT NOT NULL,
    line_items TEXT NOT NULL DEFAULT '[]',
    subtotal REAL DEFAULT 0,
    tax_rate REAL DEFAULT 0,
    total REAL DEFAULT 0,
    status TEXT DEFAULT 'Draft',
    due_date TEXT,
    sent_at TEXT,
    paid_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
  );
`);

// Seed data if empty
const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients').get();
if (clientCount.count === 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  const insertClient = db.prepare(`
    INSERT INTO clients (name, phone, email, address, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const clients = db.transaction(() => {
    const c1 = insertClient.run('James Harrington', '479-555-0101', 'james.harrington@email.com', '1204 N College Ave, Fayetteville, AR 72703', 'Prefers morning appointments. Has a large property with back lot.');
    const c2 = insertClient.run('Maria Delgado', '479-555-0182', 'mdelgado@gmail.com', '3340 W Martin Luther King Jr Blvd, Fayetteville, AR 72704', 'Monthly lawn care client. Gate code: 1847.');
    const c3 = insertClient.run('Robert Chambers', '479-555-0234', 'rchambers@outlook.com', '520 E Maple St, Fayetteville, AR 72701', 'Referred by Maria Delgado. Needs bi-weekly service.');
    const c4 = insertClient.run('Sandra Nguyen', '479-555-0317', 'snguyen@yahoo.com', '812 Sequoyah Dr, Fayetteville, AR 72701', 'Estate cleanout — multiple trips likely needed.');
    const c5 = insertClient.run('Tyler Brooks', '479-555-0456', 'tyler.brooks@email.com', '2100 Ledbetter Rd, Fayetteville, AR 72703', 'Commercial property. Contact during business hours only.');
    return [c1, c2, c3, c4, c5];
  })();

  const [c1, c2, c3, c4, c5] = clients;

  const insertAppt = db.prepare(`
    INSERT INTO appointments (client_id, title, service_type, date, time, duration_hours, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const appts = db.transaction(() => {
    const a1 = insertAppt.run(c1.lastInsertRowid, 'Spring Yard Cleanup', 'Lawn Care', `${year}-${month}-03`, '08:00', 3, 'Completed', 'Full front and back yard. Edging included.');
    const a2 = insertAppt.run(c2.lastInsertRowid, 'Monthly Lawn Mowing', 'Lawn Care', `${year}-${month}-05`, '09:00', 2, 'Completed', 'Standard monthly service.');
    const a3 = insertAppt.run(c4.lastInsertRowid, 'Estate Junk Removal - Phase 1', 'Junk Removal', `${year}-${month}-08`, '07:30', 5, 'Completed', 'Garage and basement. Customer will be present.');
    const a4 = insertAppt.run(c3.lastInsertRowid, 'Bi-Weekly Lawn Care', 'Lawn Care', `${year}-${month}-10`, '10:00', 1.5, 'Completed', 'Mow, edge, blow.');
    const a5 = insertAppt.run(c5.lastInsertRowid, 'Commercial Lot Cleanup', 'Junk Removal', `${year}-${month}-14`, '08:00', 6, 'Completed', 'Debris removal from parking lot expansion project.');
    const a6 = insertAppt.run(c1.lastInsertRowid, 'Bi-Weekly Mow & Edge', 'Lawn Care', `${year}-${month}-17`, '08:00', 2, 'Completed', 'Second visit this month.');
    const a7 = insertAppt.run(c2.lastInsertRowid, 'Shrub Trimming & Mulch', 'Lawn Care', `${year}-${month}-20`, '09:30', 3, 'Scheduled', 'Trim all shrubs, lay fresh mulch in front beds.');
    const a8 = insertAppt.run(c4.lastInsertRowid, 'Estate Junk Removal - Phase 2', 'Junk Removal', `${year}-${month}-22`, '07:30', 4, 'Scheduled', 'Remaining interior items and furniture.');
    const a9 = insertAppt.run(c3.lastInsertRowid, 'Bi-Weekly Lawn Care', 'Lawn Care', `${year}-${month}-24`, '10:00', 1.5, 'Scheduled', 'Regular bi-weekly.');
    const a10 = insertAppt.run(c5.lastInsertRowid, 'Ongoing Grounds Maintenance', 'Lawn Care', `${year}-${month}-28`, '08:00', 4, 'Scheduled', 'Monthly grounds maintenance for commercial property.');
    return [a1, a2, a3, a4, a5, a6, a7, a8, a9, a10];
  })();

  const [a1, a2, a3, a4, a5, a6] = appts;

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (client_id, appointment_id, invoice_number, line_items, subtotal, tax_rate, total, status, due_date, sent_at, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const paidDate = `${year}-${month}-12`;
  const sentDate = `${year}-${month}-15`;

  db.transaction(() => {
    insertInvoice.run(
      c1.lastInsertRowid, a1.lastInsertRowid, 'INV-001',
      JSON.stringify([{ description: 'Spring Yard Cleanup (3 hrs)', price: 225 }, { description: 'Disposal fee', price: 25 }]),
      250, 0, 250, 'Paid',
      `${year}-${month}-10`, `${year}-${month}-04`, `${year}-${month}-09`
    );
    insertInvoice.run(
      c2.lastInsertRowid, a2.lastInsertRowid, 'INV-002',
      JSON.stringify([{ description: 'Monthly Lawn Mowing (2 hrs)', price: 120 }]),
      120, 0, 120, 'Paid',
      `${year}-${month}-12`, `${year}-${month}-06`, `${year}-${month}-11`
    );
    insertInvoice.run(
      c4.lastInsertRowid, a3.lastInsertRowid, 'INV-003',
      JSON.stringify([{ description: 'Estate Junk Removal Phase 1 (5 hrs)', price: 450 }, { description: 'Dump fees', price: 85 }, { description: 'Extra labor (2 crew)', price: 100 }]),
      635, 0, 635, 'Paid',
      `${year}-${month}-15`, `${year}-${month}-09`, paidDate
    );
    insertInvoice.run(
      c5.lastInsertRowid, a5.lastInsertRowid, 'INV-004',
      JSON.stringify([{ description: 'Commercial Lot Cleanup (6 hrs)', price: 600 }, { description: 'Dumpster rental', price: 150 }, { description: 'Disposal fees', price: 95 }]),
      845, 0.08, 912.60, 'Sent',
      `${year}-${month}-28`, sentDate, null
    );
    insertInvoice.run(
      c1.lastInsertRowid, a6.lastInsertRowid, 'INV-005',
      JSON.stringify([{ description: 'Bi-Weekly Mow & Edge (2 hrs)', price: 120 }]),
      120, 0, 120, 'Draft',
      null, null, null
    );
    insertInvoice.run(
      c3.lastInsertRowid, a4.lastInsertRowid, 'INV-006',
      JSON.stringify([{ description: 'Bi-Weekly Lawn Care (1.5 hrs)', price: 90 }]),
      90, 0, 90, 'Overdue',
      `${year}-${month}-17`, `${year}-${month}-11`, null
    );
  })();
}

module.exports = db;
