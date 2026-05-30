const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/clients', require('./routes/clients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/stats', require('./routes/stats'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
