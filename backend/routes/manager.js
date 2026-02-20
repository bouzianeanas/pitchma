const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

const managerOnly = [authenticate, authorize('manager', 'admin')];

// ============================================
// POST /api/manager/pitches
// Create a new pitch
// ============================================
router.post('/pitches', ...managerOnly, async (req, res) => {
  try {
    const {
      name, description, address, latitude, longitude, neighborhood, city_id,
      sport_types, surface_type, pitch_size, capacity, price_per_hour,
      has_changing_rooms, has_showers, has_parking, has_lighting, has_cafe,
      cover_image, images,
    } = req.body;

    const result = await db.query(
      `INSERT INTO pitches (
        manager_id, name, description, address, latitude, longitude,
        neighborhood, city_id, sport_types, surface_type, pitch_size,
        capacity, price_per_hour, has_changing_rooms, has_showers,
        has_parking, has_lighting, has_cafe, cover_image, images
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
      [
        req.user.id, name, description, address, latitude, longitude,
        neighborhood, city_id, sport_types || ['football'], surface_type,
        pitch_size, capacity || 10, price_per_hour, has_changing_rooms || false,
        has_showers || false, has_parking || false, has_lighting || false,
        has_cafe || false, cover_image, images || [],
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Pitch created. Awaiting admin approval.',
      pitch: result.rows[0],
    });
  } catch (error) {
    console.error('Create pitch error:', error);
    res.status(500).json({ success: false, message: 'Failed to create pitch' });
  }
});

// ============================================
// GET /api/manager/pitches
// Get manager's pitches
// ============================================
router.get('/pitches', ...managerOnly, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.name_fr as city_name
       FROM pitches p
       LEFT JOIN cities c ON p.city_id = c.id
       WHERE p.manager_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, pitches: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pitches' });
  }
});

// ============================================
// PUT /api/manager/pitches/:id
// Update pitch details
// ============================================
router.put('/pitches/:id', ...managerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, address, latitude, longitude, neighborhood,
      sport_types, surface_type, pitch_size, capacity, price_per_hour,
      has_changing_rooms, has_showers, has_parking, has_lighting, has_cafe,
      cover_image, images, is_active,
    } = req.body;

    // Verify ownership
    const pitch = await db.query('SELECT id FROM pitches WHERE id = $1 AND manager_id = $2', [id, req.user.id]);
    if (!pitch.rows[0] && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const result = await db.query(
      `UPDATE pitches SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        address = COALESCE($3, address),
        latitude = COALESCE($4, latitude),
        longitude = COALESCE($5, longitude),
        neighborhood = COALESCE($6, neighborhood),
        sport_types = COALESCE($7, sport_types),
        surface_type = COALESCE($8, surface_type),
        pitch_size = COALESCE($9, pitch_size),
        capacity = COALESCE($10, capacity),
        price_per_hour = COALESCE($11, price_per_hour),
        has_changing_rooms = COALESCE($12, has_changing_rooms),
        has_showers = COALESCE($13, has_showers),
        has_parking = COALESCE($14, has_parking),
        has_lighting = COALESCE($15, has_lighting),
        has_cafe = COALESCE($16, has_cafe),
        cover_image = COALESCE($17, cover_image),
        images = COALESCE($18, images),
        is_active = COALESCE($19, is_active)
       WHERE id = $20 RETURNING *`,
      [name, description, address, latitude, longitude, neighborhood,
       sport_types, surface_type, pitch_size, capacity, price_per_hour,
       has_changing_rooms, has_showers, has_parking, has_lighting, has_cafe,
       cover_image, images, is_active, id]
    );

    res.json({ success: true, pitch: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update pitch' });
  }
});

// ============================================
// POST /api/manager/pitches/:id/slots
// Add availability slots
// ============================================
router.post('/pitches/:id/slots', ...managerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { slots } = req.body;
    // slots = [{ date, start_time, end_time, duration_minutes, price_override }]

    // Verify ownership
    const pitchResult = await db.query(
      'SELECT id FROM pitches WHERE id = $1 AND manager_id = $2',
      [id, req.user.id]
    );
    if (!pitchResult.rows[0] && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const created = [];
    const errors = [];

    for (const slot of slots) {
      try {
        const result = await db.query(
          `INSERT INTO availability_slots (pitch_id, date, start_time, end_time, duration_minutes, price_override)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (pitch_id, date, start_time) DO NOTHING
           RETURNING *`,
          [id, slot.date, slot.start_time, slot.end_time, slot.duration_minutes, slot.price_override || null]
        );
        if (result.rows[0]) created.push(result.rows[0]);
      } catch (e) {
        errors.push({ slot, error: e.message });
      }
    }

    res.json({ success: true, created, errors });
  } catch (error) {
    console.error('Add slots error:', error);
    res.status(500).json({ success: false, message: 'Failed to add slots' });
  }
});

// ============================================
// POST /api/manager/pitches/:id/generate-slots
// Auto-generate slots for a date range
// ============================================
router.post('/pitches/:id/generate-slots', ...managerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      start_date, end_date,
      open_time = '08:00', close_time = '23:00',
      slot_duration = 60, // minutes
      price_override,
      blocked_days = [], // 0=Sun, 1=Mon, etc.
    } = req.body;

    // Verify ownership
    const pitchResult = await db.query(
      'SELECT id FROM pitches WHERE id = $1 AND manager_id = $2',
      [id, req.user.id]
    );
    if (!pitchResult.rows[0] && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const slots = [];
    const current = new Date(start_date);
    const end = new Date(end_date);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (!blocked_days.includes(dayOfWeek)) {
        const dateStr = current.toISOString().split('T')[0];
        const [openH, openM] = open_time.split(':').map(Number);
        const [closeH, closeM] = close_time.split(':').map(Number);
        let slotStart = openH * 60 + openM;
        const closeMinutes = closeH * 60 + closeM;

        while (slotStart + slot_duration <= closeMinutes) {
          const startH = Math.floor(slotStart / 60).toString().padStart(2, '0');
          const startMin = (slotStart % 60).toString().padStart(2, '0');
          const endMinutes = slotStart + slot_duration;
          const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
          const endMin = (endMinutes % 60).toString().padStart(2, '0');

          slots.push({
            pitch_id: id,
            date: dateStr,
            start_time: `${startH}:${startMin}`,
            end_time: `${endH}:${endMin}`,
            duration_minutes: slot_duration,
            price_override: price_override || null,
          });

          slotStart += slot_duration;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    // Bulk insert
    let created = 0;
    for (const slot of slots) {
      try {
        await db.query(
          `INSERT INTO availability_slots (pitch_id, date, start_time, end_time, duration_minutes, price_override)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (pitch_id, date, start_time) DO NOTHING`,
          [slot.pitch_id, slot.date, slot.start_time, slot.end_time, slot.duration_minutes, slot.price_override]
        );
        created++;
      } catch {}
    }

    res.json({ success: true, message: `Generated ${created} slots`, total: slots.length, created });
  } catch (error) {
    console.error('Generate slots error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate slots' });
  }
});

// ============================================
// DELETE /api/manager/slots/:slotId
// Remove a slot (only if available)
// ============================================
router.delete('/slots/:slotId', ...managerOnly, async (req, res) => {
  try {
    const slot = await db.query(
      `SELECT s.* FROM availability_slots s
       JOIN pitches p ON s.pitch_id = p.id
       WHERE s.id = $1 AND (p.manager_id = $2 OR $3 = 'admin')`,
      [req.params.slotId, req.user.id, req.user.role]
    );

    if (!slot.rows[0]) return res.status(404).json({ success: false, message: 'Slot not found' });
    if (slot.rows[0].status === 'booked') {
      return res.status(400).json({ success: false, message: 'Cannot delete a booked slot' });
    }

    await db.query('DELETE FROM availability_slots WHERE id = $1', [req.params.slotId]);
    res.json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete slot' });
  }
});

// ============================================
// PATCH /api/manager/slots/:slotId/block
// Block a slot (makes it unavailable)
// ============================================
router.patch('/slots/:slotId/block', ...managerOnly, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE availability_slots SET status = 'blocked'
       WHERE id = $1 AND status = 'available'
       AND pitch_id IN (SELECT id FROM pitches WHERE manager_id = $2)
       RETURNING *`,
      [req.params.slotId, req.user.id]
    );

    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Slot not found or not available' });
    res.json({ success: true, message: 'Slot blocked', slot: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to block slot' });
  }
});

// ============================================
// GET /api/manager/bookings
// Get all bookings for manager's pitches
// ============================================
router.get('/bookings', ...managerOnly, async (req, res) => {
  try {
    const { status, pitch_id, date, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['p.manager_id = $1'];
    let params = [req.user.id];
    let paramIndex = 2;

    if (status) {
      conditions.push(`b.status = $${paramIndex++}`);
      params.push(status);
    }

    if (pitch_id) {
      conditions.push(`b.pitch_id = $${paramIndex++}`);
      params.push(pitch_id);
    }

    if (date) {
      conditions.push(`b.booking_date = $${paramIndex++}`);
      params.push(date);
    }

    params.push(limit, offset);

    const result = await db.query(
      `SELECT b.*, p.name as pitch_name, u.full_name as player_name, u.phone as player_phone
       FROM bookings b
       JOIN pitches p ON b.pitch_id = p.id
       JOIN users u ON b.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.booking_date DESC, b.start_time ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({ success: true, bookings: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// ============================================
// PATCH /api/manager/bookings/:id/confirm
// Confirm a pending booking
// ============================================
router.patch('/bookings/:id/confirm', ...managerOnly, async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE bookings b SET status = 'confirmed'
       FROM pitches p
       WHERE b.id = $1 AND b.pitch_id = p.id AND p.manager_id = $2 AND b.status = 'pending'
       RETURNING b.*`,
      [req.params.id, req.user.id]
    );

    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking confirmed', booking: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to confirm booking' });
  }
});

// ============================================
// GET /api/manager/dashboard
// Manager dashboard stats
// ============================================
router.get('/dashboard', ...managerOnly, async (req, res) => {
  try {
    const stats = await db.query(
      `SELECT
        COUNT(DISTINCT p.id) as total_pitches,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed' AND b.booking_date = CURRENT_DATE) as today_bookings,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'confirmed' AND b.booking_date >= date_trunc('month', CURRENT_DATE)) as month_bookings,
        COALESCE(SUM(b.manager_earnings) FILTER (WHERE b.status IN ('confirmed','completed') AND b.booking_date >= date_trunc('month', CURRENT_DATE)), 0) as month_earnings,
        COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'pending') as pending_bookings
       FROM pitches p
       LEFT JOIN bookings b ON b.pitch_id = p.id
       WHERE p.manager_id = $1`,
      [req.user.id]
    );

    // Upcoming bookings
    const upcomingResult = await db.query(
      `SELECT b.*, p.name as pitch_name, u.full_name as player_name, u.phone as player_phone
       FROM bookings b
       JOIN pitches p ON b.pitch_id = p.id
       JOIN users u ON b.user_id = u.id
       WHERE p.manager_id = $1 AND b.booking_date >= CURRENT_DATE
       AND b.status IN ('pending','confirmed')
       ORDER BY b.booking_date ASC, b.start_time ASC
       LIMIT 10`,
      [req.user.id]
    );

    res.json({
      success: true,
      stats: stats.rows[0],
      upcoming_bookings: upcomingResult.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
  }
});

// ============================================
// ADMIN: Approve manager application
// ============================================
router.patch('/admin/applications/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    const appResult = await db.query(
      "UPDATE manager_applications SET status = 'approved', reviewed_at = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    if (!appResult.rows[0]) return res.status(404).json({ success: false, message: 'Application not found' });

    await db.query("UPDATE users SET role = 'manager' WHERE id = $1", [appResult.rows[0].user_id]);

    res.json({ success: true, message: 'Manager approved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve manager' });
  }
});

// ============================================
// ADMIN: Approve pitch
// ============================================
router.patch('/admin/pitches/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  try {
    await db.query('UPDATE pitches SET is_approved = true WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Pitch approved and now visible' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve pitch' });
  }
});

module.exports = router;
