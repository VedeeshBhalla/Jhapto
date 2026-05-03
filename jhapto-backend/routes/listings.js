// routes/listings.js
// Handles browsing listings (floor-priority) and creating/removing listings

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// ── GET /api/listings ────────────────────────────────────────
// Returns all active listings, floor-priority sorted
// Uses the MySQL stored procedure sp_floor_priority_listings
router.get('/', auth, async (req, res) => {
  const buyer_floor_id = req.user.floor_id;
  try {
    const [rows] = await db.query(
      'CALL sp_floor_priority_listings(?)', [buyer_floor_id]
    );
    res.json(rows[0]);  // stored procedure returns result in rows[0]
  } catch (err) {
    res.status(500).json({ message: 'Error fetching listings.', error: err.message });
  }
});

// ── GET /api/listings/my ─────────────────────────────────────
// Returns all listings created by the logged-in student
router.get('/my', auth, async (req, res) => {
  const seller_id = req.user.student_id;
  try {
    const [rows] = await db.query(
      `SELECT l.listing_id, i.item_name, i.brand, l.mrp, l.selling_price,
              l.quantity_available, l.description, l.photo_url, l.listing_status, l.created_at
       FROM Listing l
       JOIN Item i ON l.item_id = i.item_id
       WHERE l.seller_id = ?
       ORDER BY l.created_at DESC`,
      [seller_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching your listings.', error: err.message });
  }
});

// ── POST /api/listings ───────────────────────────────────────
// Creates a new listing (price validation handled by DB trigger)
router.post('/', auth, async (req, res) => {
  const { item_id, mrp, selling_price, quantity_available, description, photo_url, room_number } = req.body;
  const seller_id = req.user.student_id;

  console.log("POST /api/listings payload:", { item_id, mrp, selling_price, quantity_available, description, photo_url_length: photo_url?.length, room_number });

  if (!item_id || !mrp || !selling_price || !quantity_available || !room_number) {
    console.log("Missing fields");
    return res.status(400).json({ message: 'item_id, mrp, selling_price, quantity, and room_number are required.' });
  }

  try {
    // fn_is_price_valid checks price <= 1.5x MRP
    const [check] = await db.query(
      'SELECT fn_is_price_valid(?, ?) AS valid', [mrp, selling_price]
    );
    if (!check[0].valid) {
      console.log("Price invalid");
      return res.status(400).json({ message: 'Selling price cannot exceed 1.5x MRP.' });
    }

    await db.query(
      `INSERT INTO Listing (seller_id, item_id, mrp, selling_price, quantity_available, description, photo_url, room_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [seller_id, item_id, mrp, selling_price, quantity_available, description || null, photo_url || null, room_number]
    );

    res.status(201).json({ message: 'Listing created successfully!' });
  } catch (err) {
    console.error("DB Error:", err);
    // Catch trigger errors (e.g. duplicate active listing)
    if (err.sqlState === '45000') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error creating listing.', error: err.message });
  }
});

// ── DELETE /api/listings/:id ─────────────────────────────────
// Removes a listing (only the seller can remove their own listing)
router.delete('/:id', auth, async (req, res) => {
  const listing_id = req.params.id;
  const seller_id  = req.user.student_id;

  try {
    const [rows] = await db.query(
      'SELECT seller_id FROM Listing WHERE listing_id = ?', [listing_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    if (rows[0].seller_id !== seller_id) {
      return res.status(403).json({ message: 'You can only remove your own listings.' });
    }

    await db.query(
      "UPDATE Listing SET listing_status = 'Removed' WHERE listing_id = ?", [listing_id]
    );

    res.json({ message: 'Listing removed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing listing.', error: err.message });
  }
});

// ── GET /api/listings/items ──────────────────────────────────
// Returns all items (for the "sell an item" dropdown)
router.get('/items', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT i.item_id, i.item_name, i.brand, c.category_name
       FROM Item i JOIN Category c ON i.category_id = c.category_id
       ORDER BY i.item_name`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items.', error: err.message });
  }
});

module.exports = router;
