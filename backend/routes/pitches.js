const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// ============================================
// GET /api/pitches
// Browse all pitches with filters
// ============================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      city_id,
      sport_type,
      surface_type,
      pitch_size,
      date,
      min_price,
      max_price,
      lat,
      lng,
      radius = 10, // km
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (page - 1) * limit;
    let conditions = ['p.is_active = true', 'p.is_approved = true'];
    let params = [];
    let paramIndex = 1;

    if (city_id) {
      conditions.push(`p.city_id = $${paramIndex++}`);
      params.push(city_id);
    }

    if (sport_type) {
      conditions.push(`$${paramIndex++} = ANY(p.sport_types)`);
      params.push(sport_type);
    }

    if (surface_type) {
      conditions.push(`p.surface_type = $${paramIndex++}`);
      params.push(surface_type);
    }

    if (pitch_size) {
      conditions.push(`p.pitch_size = $${paramIndex++}`);
      params.push(pitch_size);
    }

    if (min_price) {
      conditions.push(`p.price_per_hour >= $${paramIndex++}`);
      params.push(min_price);
    }

    if (max_price) {
      conditions.push(`p.price_per_hour <= $${paramIndex++}`);
      params.push(max_price);
    }

    if (search) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.address ILIKE $${paramIndex} OR p.neighborhood ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Distance filter if lat/lng provided
    let distanceSelect = '';
    let orderBy = 'p.average_rating DESC, p.total_bookings DESC';

    if (lat && lng) {
      distanceSelect = `,
        (6371 * acos(cos(radians($${paramIndex})) * cos(radians(p.latitude)) *
        cos(radians(p.longitude) - radians($${paramIndex + 1})) +
        sin(radians($${paramIndex})) * sin(radians(p.latitude)))) AS distance_km`;
      conditions.push(`p.latitude IS NOT NULL AND p.longitude IS NOT NULL`);
      conditions.push(
        `(6371 * acos(cos(radians($${paramIndex})) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians($${paramIndex + 1})) + sin(radians($${paramIndex})) * sin(radians(p.latitude)))) < $${paramIndex + 2}`
      );
      params.push(lat, lng, radius);
      paramIndex += 3;
      orderBy = 'distance_km ASC';
    }

    // Check availability if date provided
    let availabilityJoin = '';
    if (date) {
      availabilityJoin = `
        LEFT JOIN (
          SELECT pitch_id, COUNT(*) as available_slots
          FROM availability_slots
          WHERE date = $${paramIndex} AND status = 'available'
          GROUP BY pitch_id
        ) slots ON p.id = slots.pitch_id
      `;
      conditions.push('COALESCE(slots.available_slots, 0) > 0');
      params.push(date);
      paramIndex++;
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        p.id, p.name, p.address, p.neighborhood, p.latitude, p.longitude,
        p.sport_types, p.surface_type, p.pitch_size, p.price_per_hour, p.currency,
        p.cover_image, p.average_rating, p.total_reviews, p.total_bookings,
        p.has_changing_rooms, p.has_showers, p.has_parking, p.has_lighting, p.has_cafe,
        c.name_fr as city_name, c.name_ar as city_name_ar
        ${distanceSelect}
      FROM pitches p
      LEFT JOIN cities c ON p.city_id = c.id
      ${availabilityJoin}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(*) FROM pitches p
      LEFT JOIN cities c ON p.city_id = c.id
      ${availabilityJoin}
      ${whereClause}
    `;

    const [pitchesResult, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2)),
    ]);

    res.json({
      success: true,
      pitches: pitchesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get pitches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pitches' });
  }
});

// ============================================
// GET /api/pitches/:id
// Get single pitch details
// ============================================
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const pitchResult = await db.query(
      `SELECT p.*, c.name_fr as city_name, c.name_ar as city_name_ar,
        u.full_name as manager_name, u.phone as manager_phone
       FROM pitches p
       LEFT JOIN cities c ON p.city_id = c.id
       LEFT JOIN users u ON p.manager_id = u.id
       WHERE p.id = $1 AND p.is_active = true`,
      [id]
    );

    if (!pitchResult.rows[0]) {
      return res.status(404).json({ success: false, message: 'Pitch not found' });
    }

    const pitch = pitchResult.rows[0];

    // Get available slots for requested date or next 7 days
    const targetDate = date || new Date().toISOString().split('T')[0];
    const slotsResult = await db.query(
      `SELECT id, date, start_time, end_time, duration_minutes, status, price_override
       FROM availability_slots
       WHERE pitch_id = $1 AND date >= $2 AND date <= $2::date + 7
       ORDER BY date, start_time`,
      [id, targetDate]
    );

    // Get recent reviews
    const reviewsResult = await db.query(
      `SELECT r.rating, r.comment, r.created_at, u.full_name, u.avatar_url
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.pitch_id = $1
       ORDER BY r.created_at DESC LIMIT 10`,
      [id]
    );

    res.json({
      success: true,
      pitch,
      slots: slotsResult.rows,
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    console.error('Get pitch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pitch' });
  }
});

// ============================================
// GET /api/pitches/:id/slots
// Get available slots for a pitch
// ============================================
router.get('/:id/slots', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, days = 14 } = req.query;

    const startDate = date || new Date().toISOString().split('T')[0];

    const result = await db.query(
      `SELECT id, date, start_time, end_time, duration_minutes, status, price_override
       FROM availability_slots
       WHERE pitch_id = $1 AND date >= $2 AND date <= $2::date + $3 AND status != 'blocked'
       ORDER BY date, start_time`,
      [id, startDate, days]
    );

    // Group by date
    const slotsByDate = result.rows.reduce((acc, slot) => {
      const dateKey = slot.date.toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(slot);
      return acc;
    }, {});

    res.json({ success: true, slots: slotsByDate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch slots' });
  }
});

// ============================================
// GET /api/pitches/cities
// Get all cities
// ============================================
router.get('/meta/cities', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM cities ORDER BY name_fr');
    res.json({ success: true, cities: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch cities' });
  }
});

// ============================================
// POST /api/pitches/:id/review
// Add a review
// ============================================
router.post('/:id/review', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_id, rating, comment } = req.body;

    // Verify booking belongs to user and is completed
    const bookingResult = await db.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2 AND pitch_id = $3 AND status = $4',
      [booking_id, req.user.id, id, 'completed']
    );

    if (!bookingResult.rows[0]) {
      return res.status(400).json({ success: false, message: 'No completed booking found for this pitch' });
    }

    const result = await db.query(
      `INSERT INTO reviews (pitch_id, booking_id, user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, booking_id, req.user.id, rating, comment]
    );

    res.json({ success: true, review: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ success: false, message: 'Already reviewed this booking' });
    }
    res.status(500).json({ success: false, message: 'Failed to add review' });
  }
});

module.exports = router;
