const express = require('express');
const router = express.Router();
const TollGate = require('../models/TollGate');

// GET /api/tolls
router.get('/', async (req, res) => {
    try {
        const tolls = await TollGate.find();
        res.json(tolls);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
