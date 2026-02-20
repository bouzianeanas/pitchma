const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================
// POST /api/auth/send-otp
// Send OTP to phone number
// ============================================
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

    // Normalize phone (Morocco: +212...)
    const normalizedPhone = phone.startsWith('+') ? phone : `+212${phone.replace(/^0/, '')}`;

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this phone
    await db.query('DELETE FROM otp_codes WHERE phone = $1', [normalizedPhone]);

    // Save OTP
    await db.query(
      'INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, $3)',
      [normalizedPhone, otp, expiresAt]
    );

    // TODO: Send SMS via Twilio or local provider
    // For development, log the OTP
    console.log(`📱 OTP for ${normalizedPhone}: ${otp}`);

    // In production, use Twilio:
    // const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilio.messages.create({ body: `PitchMA code: ${otp}`, from: process.env.TWILIO_PHONE_NUMBER, to: normalizedPhone });

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // Remove in production:
      dev_otp: process.env.NODE_ENV === 'development' ? otp : undefined,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// ============================================
// POST /api/auth/verify-otp
// Verify OTP and login/register
// ============================================
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, full_name } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });

    const normalizedPhone = phone.startsWith('+') ? phone : `+212${phone.replace(/^0/, '')}`;

    // Check OTP
    const otpResult = await db.query(
      'SELECT * FROM otp_codes WHERE phone = $1 AND code = $2 AND used = false AND expires_at > NOW()',
      [normalizedPhone, otp]
    );

    if (!otpResult.rows[0]) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Mark OTP as used
    await db.query('UPDATE otp_codes SET used = true WHERE id = $1', [otpResult.rows[0].id]);

    // Check if user exists
    let user = (await db.query('SELECT * FROM users WHERE phone = $1', [normalizedPhone])).rows[0];

    const isNewUser = !user;

    if (!user) {
      // Register new user
      if (!full_name) {
        return res.status(200).json({
          success: true,
          is_new_user: true,
          phone: normalizedPhone,
          message: 'New user - full_name required',
        });
      }

      const result = await db.query(
        'INSERT INTO users (phone, full_name, is_verified) VALUES ($1, $2, true) RETURNING *',
        [normalizedPhone, full_name]
      );
      user = result.rows[0];
    } else {
      // Update verified status
      await db.query('UPDATE users SET is_verified = true WHERE id = $1', [user.id]);
    }

    const token = generateToken(user.id);

    res.json({
      success: true,
      is_new_user: isNewUser,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
});

// ============================================
// POST /api/auth/complete-registration
// Complete profile after OTP verification
// ============================================
router.post('/complete-registration', async (req, res) => {
  try {
    const { phone, full_name, email, preferred_language } = req.body;
    const normalizedPhone = phone.startsWith('+') ? phone : `+212${phone.replace(/^0/, '')}`;

    const result = await db.query(
      `INSERT INTO users (phone, full_name, email, is_verified, preferred_language)
       VALUES ($1, $2, $3, true, $4)
       ON CONFLICT (phone) DO UPDATE SET full_name = $2, email = $3
       RETURNING *`,
      [normalizedPhone, full_name, email || null, preferred_language || 'fr']
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Complete registration error:', error);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ============================================
// GET /api/auth/me
// Get current user profile
// ============================================
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, phone, email, full_name, role, avatar_url, preferred_language, is_verified, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
});

// ============================================
// PUT /api/auth/update-profile
// ============================================
router.put('/update-profile', authenticate, async (req, res) => {
  try {
    const { full_name, email, preferred_language, push_token } = req.body;
    const result = await db.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        email = COALESCE($2, email),
        preferred_language = COALESCE($3, preferred_language),
        push_token = COALESCE($4, push_token)
       WHERE id = $5 RETURNING id, phone, email, full_name, role, avatar_url, preferred_language`,
      [full_name, email, preferred_language, push_token, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// ============================================
// POST /api/auth/apply-manager
// Apply to become a manager
// ============================================
router.post('/apply-manager', authenticate, async (req, res) => {
  try {
    const { business_name, cin_number } = req.body;

    // Check if already applied
    const existing = await db.query(
      'SELECT id FROM manager_applications WHERE user_id = $1 AND status = $2',
      [req.user.id, 'pending']
    );
    if (existing.rows[0]) {
      return res.status(400).json({ success: false, message: 'Application already pending' });
    }

    await db.query(
      'INSERT INTO manager_applications (user_id, business_name, cin_number) VALUES ($1, $2, $3)',
      [req.user.id, business_name, cin_number]
    );

    res.json({ success: true, message: 'Application submitted. Awaiting admin approval.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Application failed' });
  }
});

module.exports = router;
