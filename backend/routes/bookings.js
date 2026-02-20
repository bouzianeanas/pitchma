const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================
// POST /api/bookings
// Create a booking
// ============================================
router.post('/', authenticate, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { slot_id, payment_method = 'cash', players_count = 1, is_open_game = false, open_game_spots = 0, notes } = req.body;

    // Get slot details with pitch info
    const slotResult = await client.query(
      `SELECT s.*, p.price_per_hour, p.manager_id, p.name as pitch_name
       FROM availability_slots s
       JOIN pitches p ON s.pitch_id = p.id
       WHERE s.id = $1 FOR UPDATE`,
      [slot_id]
    );

    const slot = slotResult.rows[0];
    if (!slot) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    if (slot.status !== 'available') {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Slot is no longer available' });
    }

    // Calculate price
    const pricePerHour = slot.price_override || slot.price_per_hour;
    const hours = slot.duration_minutes / 60;
    const totalPrice = pricePerHour * hours;
    const commissionRate = parseFloat(process.env.COMMISSION_RATE || 0.08);
    const commissionAmount = totalPrice * commissionRate;
    const managerEarnings = totalPrice - commissionAmount;

    // Create booking
    const bookingResult = await client.query(
      `INSERT INTO bookings (
        slot_id, pitch_id, user_id, booking_date, start_time, end_time,
        duration_minutes, players_count, total_price, commission_amount,
        manager_earnings, payment_method, is_open_game, open_game_spots, notes
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        slot_id, slot.pitch_id, req.user.id, slot.date, slot.start_time,
        slot.end_time, slot.duration_minutes, players_count, totalPrice,
        commissionAmount, managerEarnings, payment_method, is_open_game,
        open_game_spots, notes,
      ]
    );

    // Mark slot as booked
    await client.query(
      'UPDATE availability_slots SET status = $1 WHERE id = $2',
      ['booked', slot_id]
    );

    // Increment pitch booking count
    await client.query(
      'UPDATE pitches SET total_bookings = total_bookings + 1 WHERE id = $1',
      [slot.pitch_id]
    );

    await client.query('COMMIT');

    const booking = bookingResult.rows[0];

    // Send notifications (async, don't wait)
    sendBookingNotification(booking, slot, req.user).catch(console.error);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        ...booking,
        pitch_name: slot.pitch_name,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, message: 'Booking failed' });
  } finally {
    client.release();
  }
});

// ============================================
// GET /api/bookings
// Get user's bookings
// ============================================
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let conditions = ['b.user_id = $1'];
    let params = [req.user.id];
    let paramIndex = 2;

    if (status) {
      conditions.push(`b.status = $${paramIndex++}`);
      params.push(status);
    }

    params.push(limit, offset);

    const result = await db.query(
      `SELECT b.*, p.name as pitch_name, p.address, p.cover_image,
        p.latitude, p.longitude, c.name_fr as city_name
       FROM bookings b
       JOIN pitches p ON b.pitch_id = p.id
       LEFT JOIN cities c ON p.city_id = c.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY b.booking_date DESC, b.start_time DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    res.json({ success: true, bookings: result.rows });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch bookings' });
  }
});

// ============================================
// GET /api/bookings/:id
// Get booking details
// ============================================
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT b.*, p.name as pitch_name, p.address, p.latitude, p.longitude,
        p.cover_image, p.manager_id, c.name_fr as city_name
       FROM bookings b
       JOIN pitches p ON b.pitch_id = p.id
       LEFT JOIN cities c ON p.city_id = c.id
       WHERE b.id = $1 AND (b.user_id = $2 OR p.manager_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    res.json({ success: true, booking: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch booking' });
  }
});

// ============================================
// PATCH /api/bookings/:id/cancel
// Cancel a booking
// ============================================
router.patch('/:id/cancel', authenticate, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { reason } = req.body;

    const bookingResult = await client.query(
      `SELECT b.*, p.manager_id
       FROM bookings b JOIN pitches p ON b.pitch_id = p.id
       WHERE b.id = $1`,
      [req.params.id]
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check authorization
    const isUser = booking.user_id === req.user.id;
    const isManager = booking.manager_id === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isUser && !isManager && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Booking cannot be cancelled' });
    }

    const cancelledBy = isAdmin ? 'admin' : isManager ? 'manager' : 'user';

    // Update booking
    await client.query(
      `UPDATE bookings SET status = 'cancelled', cancelled_by = $1, cancellation_reason = $2
       WHERE id = $3`,
      [cancelledBy, reason, booking.id]
    );

    // Free up the slot
    await client.query(
      "UPDATE availability_slots SET status = 'available' WHERE id = $1",
      [booking.slot_id]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, message: 'Cancellation failed' });
  } finally {
    client.release();
  }
});

// ============================================
// POST /api/bookings/:id/join-open-game
// Join an open game
// ============================================
router.post('/:id/join-open-game', authenticate, async (req, res) => {
  try {
    const bookingResult = await db.query(
      `SELECT b.*, COUNT(ogp.id) as current_participants
       FROM bookings b
       LEFT JOIN open_game_participants ogp ON ogp.booking_id = b.id
       WHERE b.id = $1 AND b.is_open_game = true AND b.status = 'confirmed'
       GROUP BY b.id`,
      [req.params.id]
    );

    const booking = bookingResult.rows[0];
    if (!booking) return res.status(404).json({ success: false, message: 'Open game not found' });

    if (parseInt(booking.current_participants) >= booking.open_game_spots) {
      return res.status(400).json({ success: false, message: 'Game is full' });
    }

    const sharePrice = booking.total_price / (booking.open_game_spots + 1);

    await db.query(
      'INSERT INTO open_game_participants (booking_id, user_id, share_price) VALUES ($1, $2, $3)',
      [booking.id, req.user.id, sharePrice]
    );

    res.json({ success: true, message: 'Joined open game', share_price: sharePrice });
  } catch (error) {
    if (error.code === '23505') return res.status(400).json({ success: false, message: 'Already joined' });
    res.status(500).json({ success: false, message: 'Failed to join game' });
  }
});

// Helper: send notification
async function sendBookingNotification(booking, slot, user) {
  // Get manager's push token
  const managerResult = await db.query(
    'SELECT push_token FROM users WHERE id = (SELECT manager_id FROM pitches WHERE id = $1)',
    [booking.pitch_id]
  );

  const manager = managerResult.rows[0];
  if (manager?.push_token) {
    // Send push notification via Firebase
    // const admin = require('firebase-admin');
    // await admin.messaging().send({ token: manager.push_token, notification: { title: 'New Booking!', body: `${user.full_name} booked a slot` } });
    console.log(`📱 Notification to manager: New booking from ${user.full_name}`);
  }
}

module.exports = router;
