const mongoose = require('mongoose');

const TollGateSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    cost: {
        car: { type: Number, required: true },
        bike: { type: Number, default: 0 }, // Bikes are often free, but good to have
        truck: { type: Number },
    },
    type: { type: String, enum: ['Expressway', 'Highway', 'Bridge'], default: 'Highway' }
});

module.exports = mongoose.model('TollGate', TollGateSchema);
