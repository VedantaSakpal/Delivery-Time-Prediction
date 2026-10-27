/**
 * Virtual 3D City Coordinates & Distance Engine
 * Standardized coordinate space for registered restaurants, urban landmarks, and user drop-off pins.
 * Coordinate bounds: X in [-60, 60], Z in [-60, 60].
 */

export const FIXED_RESTAURANT_LOCATIONS = {
  // 1. Bella Italia Trattoria
  '18ed29db-e1c0-44d3-9339-a183b3b4985b': {
    x: -14,
    z: -12,
    district: 'Downtown Piazza',
    landmark: 'Central Fountain Plaza, Sector A-1',
    color: '#ef4444'
  },
  // 2. Smash & Sizzle Burger Co.
  '8b51ffae-d747-4612-9ff6-c53b2cbd4de7': {
    x: -34,
    z: 10,
    district: 'Westside Cyber Arcade',
    landmark: '108 Broadway Boulevard, Sector B-3',
    color: '#f97316'
  },
  // 3. Sakura Japanese Ramen & Sushi
  '07179b77-e9ea-426a-ade3-50beab986685': {
    x: 6,
    z: -30,
    district: 'Midtown Neon Avenue',
    landmark: '77 Sakura Crosswalk, Sector A-4',
    color: '#ec4899'
  },
  // 4. Tacos El Fuego
  '3263e0b6-ebbe-43b4-a38c-3e7836537461': {
    x: -20,
    z: 32,
    district: 'Southside Riverside',
    landmark: '210 Mission Street Bridge, Sector C-2',
    color: '#ea580c'
  },
  // 5. Green Garden Health & Bowls
  '11a9bb5a-eede-48c9-9b0a-d99a3790808e': {
    x: 28,
    z: 24,
    district: 'Green Eco Park District',
    landmark: '15 Eco Walkways, Sector D-1',
    color: '#10b981'
  },
  // 6. Spice Route Indian Kitchen
  '40c1215c-0990-40e2-9769-3c03c1733ebd': {
    x: 20,
    z: -18,
    district: 'Heritage Fort Enclave',
    landmark: '315 Heritage Ramparts, Sector E-3',
    color: '#f59e0b'
  },
  // 7. Punjab Grill & Rasoi
  '6e9b3cc8-5e05-4e29-8596-6ddb03fa454a': {
    x: -38,
    z: -32,
    district: 'Linking Road Promenade',
    landmark: 'Shop 14, Linking Road, Bandra West',
    color: '#d97706'
  },
  // 8. Hyderabadi Dastarkhwan
  'e9b24ddf-f2a0-47c2-b0ed-5b512bac2805': {
    x: 32,
    z: -32,
    district: 'Royal Nizami Boulevard',
    landmark: 'Plot 88, Banjara Hills Road No. 12',
    color: '#b45309'
  },
  // 9. Dakshin Tiffin House
  '5587ce5f-257c-4b23-affb-6e9bedce4055': {
    x: 38,
    z: 8,
    district: 'Indiranagar Tech Square',
    landmark: '45 100 Feet Road, East Gate',
    color: '#059669'
  },
  // 10. Chowpatty Street Chaat Co.
  '2bbe19a5-629d-4d55-80c0-4e439732245d': {
    x: -44,
    z: 26,
    district: 'Juhu Promenade Waterfront',
    landmark: 'Near Coastal Pier & Marine Walk',
    color: '#0284c7'
  },
  // 11. Dilli 6 Kebabs & Tandoor
  '9109c04b-43b2-4703-8810-76d7e00376dd': {
    x: 0,
    z: 38,
    district: 'Chandni Chowk Old Bazaar',
    landmark: 'Spicemarket Chowk, Sector J-3',
    color: '#dc2626'
  },
  // 12. Bikaneri Sweets & Snacks
  '291ccfc6-a610-4dbe-8dd4-4db5fdc02ca0': {
    x: 16,
    z: 6,
    district: 'Grand Junction Central',
    landmark: 'Station Road Arcade, Sector K-1',
    color: '#eab308'
  }
};

export const CITY_PRESET_NEIGHBORHOODS = [
  { name: 'Powai Tech Park', district: 'Indiranagar Tech Square', x: 42, z: 16, icon: '🏢' },
  { name: 'Cyber Arcade Towers', district: 'Westside Cyber Arcade', x: -36, z: 16, icon: '🏙️' },
  { name: 'Marina Coastal Drive', district: 'Juhu Promenade Waterfront', x: -46, z: 30, icon: '🌊' },
  { name: 'Green Canopy Residencies', district: 'Green Eco Park District', x: 30, z: 28, icon: '🌳' },
  { name: 'Heritage Fort Mansions', district: 'Heritage Fort Enclave', x: 22, z: -24, icon: '🏰' },
  { name: 'Linking Road Heights', district: 'Linking Road Promenade', x: -40, z: -28, icon: '🛍️' },
  { name: 'Old Bazaar Havelis', district: 'Chandni Chowk Old Bazaar', x: -2, z: 42, icon: '🕌' }
];

/**
 * Returns fixed 3D coordinates for a restaurant by ID or name, with deterministic fallback.
 */
export function getRestaurantVirtualLocation(restaurantId, restaurantName = '') {
  if (restaurantId && FIXED_RESTAURANT_LOCATIONS[restaurantId]) {
    return {
      ...FIXED_RESTAURANT_LOCATIONS[restaurantId],
      name: restaurantName || 'Culinary Hub'
    };
  }

  // Fallback: match by partial name
  const lowerName = (restaurantName || '').toLowerCase();
  for (const [id, data] of Object.entries(FIXED_RESTAURANT_LOCATIONS)) {
    if (lowerName && (lowerName.includes(data.district.toLowerCase()) || lowerName.includes('punjab') || lowerName.includes('italia') || lowerName.includes('hyderabad'))) {
      return { ...data, name: restaurantName };
    }
  }

  // Deterministic hash based on ID/Name
  let hash = 0;
  const str = restaurantId || restaurantName || 'justwoww-default';
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const angles = [0.3, 0.9, 1.5, 2.1, 2.8, 3.4, 4.1, 4.8, 5.5, 6.1];
  const radius = 22 + (Math.abs(hash) % 18);
  const angle = angles[Math.abs(hash) % angles.length];
  const x = Math.round(Math.cos(angle) * radius);
  const z = Math.round(Math.sin(angle) * radius);

  return {
    x,
    z,
    district: `City Sector ${(Math.abs(hash) % 8) + 1}`,
    landmark: `Avenue Block ${(Math.abs(hash) % 12) + 1}`,
    color: '#f59e0b',
    name: restaurantName || 'Restaurant Hub'
  };
}

/**
 * Calculates realistic road-transit distance (in km) between two 3D coordinates.
 * Incorporates urban road curvature (Manhattan + Euclidean blend).
 */
export function calculateDistanceKm(pos1, pos2) {
  if (!pos1 || !pos2) return 3.5;
  const dx = pos1.x - pos2.x;
  const dz = pos1.z - pos2.z;
  const euclidean = Math.sqrt(dx * dx + dz * dz);
  const manhattan = Math.abs(dx) + Math.abs(dz);

  // Urban road grid factor (weighted combination)
  const urbanDistance = 0.55 * euclidean + 0.45 * manhattan;

  // Scale: converts virtual grid units into realistic urban kilometers (1.2 km - 12.0 km)
  const km = urbanDistance * 0.10 + 1.2;
  return Number(Math.min(12.5, Math.max(1.1, km)).toFixed(1));
}

/**
 * Generates an estimated delivery duration (minutes) for HUD preview.
 */
export function estimateDeliveryDurationMin(distanceKm, prepTimeMin = 15) {
  const est = 10 + prepTimeMin * 0.75 + distanceKm * 3.1;
  return Math.round(Math.max(18, Math.min(65, est)));
}

/**
 * Finds the closest district to an (x, z) coordinate.
 */
export function findNearestDistrict(x, z) {
  let closest = CITY_PRESET_NEIGHBORHOODS[0];
  let minD = Infinity;
  for (const n of CITY_PRESET_NEIGHBORHOODS) {
    const d = (n.x - x) ** 2 + (n.z - z) ** 2;
    if (d < minD) {
      minD = d;
      closest = n;
    }
  }
  return closest;
}

/**
 * Generates a clean human-readable delivery address from virtual coordinates.
 */
export function generateVirtualAddress(pos) {
  if (!pos) return 'Virtual City Central';
  const nearest = findNearestDistrict(pos.x, pos.z);
  const blockNum = Math.abs(Math.round(pos.x * 3 + pos.z * 5)) % 40 + 101;
  return `Flat ${blockNum}, ${nearest.name}, ${nearest.district}, Virtual City (X: ${Math.round(pos.x)}, Z: ${Math.round(pos.z)})`;
}
