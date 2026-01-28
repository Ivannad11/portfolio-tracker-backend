const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
  origin: '*'
}));
app.use(express.json());

const PORT = process.env.PORT || 8080;
const TINKOFF_API = 'https://invest-public-api.tinkoff.ru/rest/safe/';

async function getPortfolio(token) {
  try {
    // Аккаунты
    const accounts = await fetch(`${TINKOFF_API}user/accounts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());
    
    if (!accounts.payload?.accounts?.[0]) return [];

    const accountId = accounts.payload.accounts[0].id;
    
    // Портфель
    const portfolio = await fetch(`${TINKOFF_API}portfolio?accountId=${accountId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json());

    return (portfolio.payload?.positions || [])
      .filter(p => p.quantity > 0)
      .map(p => ({
        ticker: p.ticker || 'N/A',
        quantity: p.quantity,
        averagePrice: parseFloat(p.averagePositionPrice?.value || 0),
        currentPrice: parseFloat(p.currentPrice?.value || 0)
      }));
  } catch (e) {
    throw new Error(e.message);
  }
}

app.get('/api/status', (req, res) => res.json({ status: 'OK' }));
app.get('/', (req, res) => res.json({ ready: true }));

app.post('/api/tinkoff/sync', async (req, res) => {
  try {
    const { token } = req.body;
    const positions = await getPortfolio(token);
    res.json({ success: true, positions, count: positions.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Portfolio Tracker: http://localhost:${PORT}`);
});
