// routes/orders.js
// Handles placing orders, viewing order history, and updating order status

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const auth    = require('../middleware/auth');

// ── POST /api/orders ─────────────────────────────────────────
// Places a new order using the MySQL stored procedure
router.post('/', auth, async (req, res) => {
  const { listing_id, quantity } = req.body;
  const buyer_id = req.user.student_id;

  if (!listing_id || !quantity) {
    return res.status(400).json({ message: 'listing_id and quantity are required.' });
  }

  try {
    // Call the stored procedure place_order()
    await db.query('CALL place_order(?, ?, ?, @order_id, @message)',
      [buyer_id, listing_id, quantity]
    );

    const [[result]] = await db.query(
      'SELECT @order_id AS order_id, @message AS message'
    );

    if (result.order_id === -1) {
      return res.status(400).json({ message: result.message });
    }

    res.status(201).json({
      message  : result.message,
      order_id : result.order_id,
    });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error placing order.', error: err.message });
  }
});

// ── GET /api/orders/my ───────────────────────────────────────
// Returns all orders placed by the logged-in buyer
router.get('/my', auth, async (req, res) => {
  const buyer_id = req.user.student_id;
  try {
    const [rows] = await db.query(
      `SELECT o.order_id, i.item_name, oi.quantity, oi.price_at_purchase,
              o.total_amount, o.order_status, o.created_at,
              seller.name AS seller_name, seller.phone_no AS seller_phone, l.seller_id
       FROM \`Order\` o
       JOIN Order_Item oi ON o.order_id    = oi.order_id
       JOIN Listing    l  ON oi.listing_id = l.listing_id
       JOIN Item       i  ON l.item_id     = i.item_id
       JOIN Student    seller ON l.seller_id = seller.student_id
       WHERE o.buyer_id = ?
       ORDER BY o.created_at DESC`,
      [buyer_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders.', error: err.message });
  }
});

// ── GET /api/orders/selling ──────────────────────────────────
// Returns all orders received by the logged-in student as a seller
router.get('/selling', auth, async (req, res) => {
  const seller_id = req.user.student_id;
  try {
    const [rows] = await db.query(
      `SELECT o.order_id, i.item_name, oi.quantity, oi.price_at_purchase,
              o.total_amount, o.order_status, o.created_at,
              buyer.name AS buyer_name, buyer.phone_no AS buyer_phone, o.buyer_id
       FROM \`Order\` o
       JOIN Order_Item oi ON o.order_id    = oi.order_id
       JOIN Listing    l  ON oi.listing_id = l.listing_id
       JOIN Item       i  ON l.item_id     = i.item_id
       JOIN Student    buyer ON o.buyer_id = buyer.student_id
       WHERE l.seller_id = ?
       ORDER BY o.created_at DESC`,
      [seller_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching selling orders.', error: err.message });
  }
});

// ── PATCH /api/orders/:id/cancel ────────────────────────────
// Buyer cancels their order (only allowed if status = Placed)
// Trigger trg_cancel_only_if_placed enforces this in DB
router.patch('/:id/cancel', auth, async (req, res) => {
  const order_id = req.params.id;
  const buyer_id = req.user.student_id;

  try {
    const [rows] = await db.query(
      'SELECT buyer_id, order_status FROM `Order` WHERE order_id = ?', [order_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Order not found.' });
    }
    if (rows[0].buyer_id !== buyer_id) {
      return res.status(403).json({ message: 'You can only cancel your own orders.' });
    }

    await db.query(
      "UPDATE `Order` SET order_status = 'Cancelled' WHERE order_id = ?", [order_id]
    );

    res.json({ message: 'Order cancelled successfully.' });
  } catch (err) {
    if (err.sqlState === '45000') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error cancelling order.', error: err.message });
  }
});

// ── PATCH /api/orders/:id/confirm ───────────────────────────
// Seller confirms an order
router.patch('/:id/confirm', auth, async (req, res) => {
  const order_id  = req.params.id;
  const seller_id = req.user.student_id;

  try {
    // Verify this order belongs to one of the seller's listings
    const [rows] = await db.query(
      `SELECT o.order_id FROM \`Order\` o
       JOIN Order_Item oi ON o.order_id    = oi.order_id
       JOIN Listing    l  ON oi.listing_id = l.listing_id
       WHERE o.order_id = ? AND l.seller_id = ?`,
      [order_id, seller_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Not authorised to confirm this order.' });
    }

    await db.query(
      "UPDATE `Order` SET order_status = 'Confirmed' WHERE order_id = ?", [order_id]
    );

    res.json({ message: 'Order confirmed!' });
  } catch (err) {
    res.status(500).json({ message: 'Error confirming order.', error: err.message });
  }
});

// ── PATCH /api/orders/:id/deliver ───────────────────────────
// Seller marks an order as delivered
router.patch('/:id/deliver', auth, async (req, res) => {
  const order_id  = req.params.id;
  const seller_id = req.user.student_id;

  try {
    const [rows] = await db.query(
      `SELECT o.order_id FROM \`Order\` o
       JOIN Order_Item oi ON o.order_id    = oi.order_id
       JOIN Listing    l  ON oi.listing_id = l.listing_id
       WHERE o.order_id = ? AND l.seller_id = ?`,
      [order_id, seller_id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ message: 'Not authorised to update this order.' });
    }

    await db.query(
      "UPDATE `Order` SET order_status = 'Delivered' WHERE order_id = ?", [order_id]
    );

    res.json({ message: 'Order marked as delivered!' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating order.', error: err.message });
  }
});

module.exports = router;
