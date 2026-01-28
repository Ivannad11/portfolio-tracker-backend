const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

console.log('🚀 Portfolio Tracker Backend Starting...');

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Portfolio Tracker Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.post('/api/tinkoff/sync', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    console.log('📊 Syncing portfolio...');

    // Используем более универсальный подход для работы с API
    const axios = require('axios');
    
    // Здесь может быть логика работы с Tinkoff API
    res.json({
      success: true,
      positions: [],
      accountId: 'demo',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Tinkoff API Error:', error.message);
    res.status(400).json({
      error: error.message,
      details: error.message,
    });
  }
});

app.get('/api/price/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    res.json({
      ticker: ticker.toUpperCase(),
      price: 0,
      currency: 'RUB',
      name: ticker,
    });
  } catch (error) {
    console.error('❌ Error fetching price:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log('\n📍 API Endpoints:');
  console.log(`  GET  /api/status`);
  console.log(`  POST /api/tinkoff/sync`);
  console.log(`  GET  /api/price/:ticker\n`);
});
