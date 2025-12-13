const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const path = require('path');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/books', require('./routes/book.routes'));
app.use('/api/masters', require('./routes/master.routes'));
<<<<<<< HEAD

=======
app.use('/api/interests', require('./routes/interest.routes'));
>>>>>>> 64231013ff1c6a06b55ca4a8d3299151624886dd
app.use('/api/readers', require('./routes/reader.routes'));
app.use('/api/orders', require('./routes/order.routes'));

app.get('/', (req, res) => {
  res.send('AGT Book Panel Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
