const axios = require('axios');

// Uses OpenStreetMap Nominatim — free, no API key required
async function geocodeAddress(address) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: { q: address, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'SolveNet/1.0 (hackathon project)' },
      timeout: 6000,
    });

    const results = response.data;
    if (!results || results.length === 0) return { coordinates: [0, 0] };

    const { lon, lat } = results[0];
    return { coordinates: [parseFloat(lon), parseFloat(lat)] };
  } catch {
    return { coordinates: [0, 0] };
  }
}

function haversineKm([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function geoBoost(coordsA, coordsB) {
  if (coordsA.every(v => v === 0) || coordsB.every(v => v === 0)) return 0;
  const km = haversineKm(coordsA, coordsB);
  if (km < 50)   return 0.15;
  if (km < 500)  return 0.10;
  if (km < 2000) return 0.05;
  return 0;
}

module.exports = { geocodeAddress, geoBoost };
