const mongoose = require('mongoose');

const citySnapshotSchema = new mongoose.Schema(
  {
    cityId: { type: String, required: true, index: true },
    cityName: { type: String, required: true },
    country: String,
    flag: String,
    coordinates: {
      lat: Number,
      lon: Number,
    },
    timestamp: { type: Date, default: Date.now, index: true },
    weather: {
      temperature: Number,     // °C
      feelsLike: Number,       // °C
      tempMin: Number,
      tempMax: Number,
      humidity: Number,        // %
      windSpeed: Number,       // m/s
      windDeg: Number,
      pressure: Number,        // hPa
      visibility: Number,      // meters
      description: String,
      icon: String,
      cloudiness: Number,      // %
    },
    aqi: {
      value: { type: Number, min: 1, max: 5 }, // 1–5 OWM scale
      category: String,        // Good, Fair, Moderate, Poor, Very Poor
      pm25: Number,
      pm10: Number,
      o3: Number,
      no2: Number,
      so2: Number,
      co: Number,
      nh3: Number,
    },
    population: Number,
    currency: {
      code: String,
      symbol: String,
      name: String,
      rateToINR: Number,       // 1 unit of local currency = X INR
      rateFrom1INR: Number,    // 1 INR = X local currency
      lastUpdated: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// TTL index: auto-delete documents older than 15 days
citySnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 15 * 24 * 60 * 60 });

// Compound index for efficient history queries
citySnapshotSchema.index({ cityId: 1, timestamp: -1 });

const CitySnapshot = mongoose.model('CitySnapshot', citySnapshotSchema);

module.exports = CitySnapshot;
