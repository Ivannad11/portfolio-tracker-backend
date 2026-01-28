const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { TinkoffInvestApi } = require('@tinkoff/invest-api');

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

    const api = new TinkoffInvestApi({
      token: token,
      appName: 'PortfolioTracker/1.0',
    });

    const accounts = await api.users.getAccounts({});
    
    if (!accounts.accounts || accounts.accounts.length === 0) {
      return res.status(400).json({ error: 'No accounts found' });
    }

    const accountId = accounts.accounts[0].id;
    console.log('✅ Account found: ' + accountId);

    const portfolio = await api.operations.getPortfolio({
      accountId: accountId,
    });

    console.log('📈 Processing ' + portfolio.positions.length + ' positions...');

    const positions = [];
    
    for (const pos of portfolio.positions) {
      try {
        const instrument = await api.instruments.getInstrumentBy({
          idType: 'FIGI',
          classCode: '',
          id: pos.figi,
        });

        const ticker = instrument.instrument?.ticker || pos.figi;
        const quantity = pos.quantityLots?.units || 0;
        const buyPrice = pos.averagePositionPrice?.units + (pos.averagePositionPrice?.nano || 0) / 1e9;
        const currentPrice = pos.currentPrice?.units + (pos.currentPrice?.nano || 0) / 1e9;

        if (quantity > 0 && buyPrice > 0 && currentPrice > 0) {
          positions.push({
            ticker: ticker,
            quantity: quantity,
            averagePrice: parseFloat(buyPrice.toFixed(2)),
            currentPrice: parseFloat(currentPrice.toFixed(2)),
            figi: pos.figi,
          });
          console.log(`  ✓ ${ticker}: ${quantity} @ ${currentPrice.toFixed(2)} ₽`);
        }
      } catch (err) {
        console.warn(`⚠️  Error processing ${pos.figi}: ${err.message}`);
      }
    }

    console.log(`✅ Synced ${positions.length} positions`);

    res.json({
      success: true,
      positions: positions,
      accountId: accountId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Tinkoff API Error:', error.message);
    
    let errorMessage = error.message;
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      errorMessage = 'Invalid or expired token';
    } else if (error.message.includes('403')) {
      errorMessage = 'Access denied. Check token permissions';
    }

    res.status(400).json({
      error: errorMessage,
      details: error.message,
    });
  }
});

app.get('/api/price/:ticker', async (req, res) => {
  try {
    const token = process.env.TINKOFF_TOKEN;
    if (!token) {
      return res.status(400).json({ error: 'TINKOFF_TOKEN not configured' });
    }

    const api = new TinkoffInvestApi({
      token: token,
      appName: 'PortfolioTracker/1.0',
    });

    const { ticker } = req.params;

    const instruments = await api.instruments.findInstrument({
      query: ticker.toUpperCase(),
    });

    if (!instruments.instruments || instruments.instruments.length === 0) {
      return res.status(404).json({ error: `Instrument ${ticker} not found` });
    }

    const instrument = instruments.instruments[0];
    const lastPrice = instrument.lastPrice?.units + (instrument.lastPrice?.nano || 0) / 1e9;

    res.json({
      ticker: instrument.ticker,
      price: parseFloat(lastPrice.toFixed(2)),
      currency: instrument.currency,
      name: instrument.name,
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
