const express = require('express');
const router = express.Router();
const CitySnapshot = require('../models/CitySnapshot');
const CITIES = require('../config/cities');

/**
 * GET /api/cities
 * Returns the latest snapshot for all 10 cities
 */
router.get('/', async (req, res) => {
  try {
    // Get the most recent snapshot for each city using aggregation
    const latestSnapshots = await CitySnapshot.aggregate([
      { $sort: { cityId: 1, timestamp: -1 } },
      {
        $group: {
          _id: '$cityId',
          doc: { $first: '$$ROOT' },
        },
      },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { cityName: 1 } },
    ]);

    // If no data in DB yet, return city stubs with null data
    if (latestSnapshots.length === 0) {
      const stubs = CITIES.map((c) => ({
        cityId: c.id,
        cityName: c.name,
        country: c.country,
        flag: c.flag,
        coordinates: { lat: c.lat, lon: c.lon },
        population: c.population,
        currency: { code: c.currency.code, symbol: c.currency.symbol, name: c.currency.name },
        weather: null,
        aqi: null,
        timestamp: null,
        _loading: true,
      }));
      return res.json({ success: true, count: stubs.length, data: stubs, loading: true });
    }

    res.json({ success: true, count: latestSnapshots.length, data: latestSnapshots });
  } catch (err) {
    console.error('GET /api/cities error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch cities data' });
  }
});

/**
 * GET /api/cities/:id
 * Returns the latest snapshot for a single city
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate city ID
    const cityConfig = CITIES.find((c) => c.id === id);
    if (!cityConfig) {
      return res.status(404).json({ success: false, error: `City '${id}' not found` });
    }

    const snapshot = await CitySnapshot.findOne({ cityId: id }).sort({ timestamp: -1 }).lean();

    if (!snapshot) {
      return res.json({
        success: true,
        data: {
          cityId: cityConfig.id,
          cityName: cityConfig.name,
          country: cityConfig.country,
          flag: cityConfig.flag,
          coordinates: { lat: cityConfig.lat, lon: cityConfig.lon },
          population: cityConfig.population,
          currency: cityConfig.currency,
          weather: null,
          aqi: null,
          timestamp: null,
          _loading: true,
        },
      });
    }

    res.json({ success: true, data: snapshot });
  } catch (err) {
    console.error(`GET /api/cities/${req.params.id} error:`, err);
    res.status(500).json({ success: false, error: 'Failed to fetch city data' });
  }
});

/**
 * GET /api/cities/:id/history
 * Returns last 7–15 days of snapshots for trend charts
 * Query param: ?days=7 (default 7, max 15)
 */
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const days = Math.min(parseInt(req.query.days) || 7, 15);

    const cityConfig = CITIES.find((c) => c.id === id);
    if (!cityConfig) {
      return res.status(404).json({ success: false, error: `City '${id}' not found` });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await CitySnapshot.find(
      { cityId: id, timestamp: { $gte: since } },
      { timestamp: 1, 'weather.temperature': 1, 'aqi.value': 1, 'aqi.category': 1, 'weather.humidity': 1, _id: 0 }
    )
      .sort({ timestamp: 1 })
      .lean();

    // Downsample to max 1 point per hour to keep response lean
    const hourlyHistory = [];
    const seenHours = new Set();
    for (const snap of history) {
      const hourKey = new Date(snap.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      if (!seenHours.has(hourKey)) {
        seenHours.add(hourKey);
        hourlyHistory.push(snap);
      }
    }

    res.json({
      success: true,
      cityId: id,
      cityName: cityConfig.name,
      days,
      count: hourlyHistory.length,
      data: hourlyHistory,
    });
  } catch (err) {
    console.error(`GET /api/cities/${req.params.id}/history error:`, err);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

module.exports = router;
