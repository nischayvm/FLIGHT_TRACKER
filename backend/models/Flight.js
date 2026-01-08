const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
    flightId: {
        type: String, // e.g. "ICAO24" address
        required: true,
        unique: true,
    },
    callsign: String,
    country: String,
    longitude: Number,
    latitude: Number,
    altitude: Number, // barometric altitude
    onGround: Boolean,
    velocity: Number,
    trueTrack: Number,
    heading: Number,
    lastUpdated: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

module.exports = mongoose.model('Flight', flightSchema);
