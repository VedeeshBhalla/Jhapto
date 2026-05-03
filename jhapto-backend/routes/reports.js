// routes/reports.js
const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// POST /api/reports
router.post('/', auth, async (req, res) => {
  const reporter_id = req.user.student_id;
  const { order_id, reported_user_id, reason, proof_url } = req.body;

  if (!order_id || !reported_user_id || !reason) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    await db.query(
      `INSERT INTO Report (order_id, reporter_id, reported_user_id, reason, proof_url)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, reporter_id, reported_user_id, reason, proof_url || null]
    );

    res.status(201).json({ message: 'Report submitted successfully. Admins will review it.' });
  } catch (err) {
    res.status(500).json({ message: 'Error submitting report.', error: err.message });
  }
});

module.exports = router;
