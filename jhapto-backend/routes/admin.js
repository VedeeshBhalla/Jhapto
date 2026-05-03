// routes/admin.js
// Admin-only routes: ban students, remove listings, view reports

const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/db');
require('dotenv').config();

// ── Admin auth middleware (separate from student auth) ───────
const adminAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Admin access required.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.is_admin) return res.status(403).json({ message: 'Not an admin.' });
    req.admin = decoded;
    next();
  } catch {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

// ── POST /api/admin/register ─────────────────────────────────
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }
  try {
    const [existing] = await db.query('SELECT admin_id FROM Admin WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Admin email already registered.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO Admin (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );
    res.status(201).json({ message: 'Admin registered successfully! Please log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── POST /api/admin/login ────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT * FROM Admin WHERE email = ?', [email]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }
    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password.' });
    }
    const token = jwt.sign(
      { admin_id: admin.admin_id, name: admin.name, is_admin: true },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({ message: 'Admin login successful!', token });
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
});

// ── GET /api/admin/listings ──────────────────────────────────
// View all listings (uses vw_admin_listings view)
router.get('/listings', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vw_admin_listings ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings.', error: err.message });
  }
});

// ── DELETE /api/admin/listings/:id ──────────────────────────
// Admin removes a listing
router.delete('/listings/:id', adminAuth, async (req, res) => {
  try {
    await db.query(
      "UPDATE Listing SET listing_status = 'Removed' WHERE listing_id = ?",
      [req.params.id]
    );
    res.json({ message: 'Listing removed by admin.' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing listing.', error: err.message });
  }
});

// ── PATCH /api/admin/students/:id/ban ───────────────────────
// Admin bans a student
router.patch('/students/:id/ban', adminAuth, async (req, res) => {
  try {
    await db.query(
      'UPDATE Student SET is_banned = TRUE WHERE student_id = ?', [req.params.id]
    );
    res.json({ message: 'Student banned successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error banning student.', error: err.message });
  }
});

// ── PATCH /api/admin/students/:id/unban ─────────────────────
// Admin unbans a student
router.patch('/students/:id/unban', adminAuth, async (req, res) => {
  try {
    await db.query(
      'UPDATE Student SET is_banned = FALSE WHERE student_id = ?', [req.params.id]
    );
    res.json({ message: 'Student unbanned successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error unbanning student.', error: err.message });
  }
});

// ── GET /api/admin/report ────────────────────────────────────
// Full admin report using stored procedure with cursor
router.get('/report', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query('CALL sp_admin_report()');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error generating report.', error: err.message });
  }
});

// ── GET /api/admin/students ──────────────────────────────────
// View all students
router.get('/students', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT s.student_id, s.name, s.email, s.phone_no,
              f.floor_number, s.is_banned, s.created_at
       FROM Student s JOIN Floor f ON s.floor_id = f.floor_id
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching students.', error: err.message });
  }
});

module.exports = router;
