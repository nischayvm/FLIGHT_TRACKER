const axios = require('axios');
const Flight = require('../models/Flight');

// Bounding box for a busy region (e.g., Europe or US East Coast) to ensure we get data but not too much
// Using approx Switzerland/Central Europe for density
// minLat, minLon, maxLat, maxLon
// Karnataka, India (Approximate bounding box)
const BOUNDS = {
    lamin: 11.50,
    lomin: 74.00,
    lamax: 18.50,
    lomax: 78.50
};

// OpenSky API URL (Anonymous access: 400 credits/day, Authenticated: 4000)
// We'll try anonymous first, bounded by area to reduce load.
const OPENSKY_URL = 'https://opensky-network.org/api/states/all';

/**
 * Fetch flight data from OpenSky
 */
const fetchFlightData = async () => {
    try {
        // Construct query parameters
        const params = {
            lamin: BOUNDS.lamin,
            lomin: BOUNDS.lomin,
            lamax: BOUNDS.lamax,
            lomax: BOUNDS.lomax
        };

        const response = await axios.get(OPENSKY_URL, { params });
        const { states } = response.data;

        if (!states || states.length === 0) {
            console.log('No flights found in region.');
            return [];
        }

        // Map OpenSky data format to our Schema format
        // OpenSky returns array of arrays. Index mapping:
        // 0: icao24, 1: callsign, 2: origin_country, 5: longitude, 6: latitude, 7: baro_altitude, 8: on_ground, 9: velocity, 10: true_track
        const flights = states.map(state => ({
            flightId: state[0],
            callsign: state[1] ? state[1].trim() : 'Unknown',
            country: state[2],
            longitude: state[5],
            latitude: state[6],
            altitude: state[7],
            onGround: state[8],
            velocity: state[9],
            heading: state[10], // true track
            lastUpdated: new Date()
        }));

        // Async: Persist to MongoDB (Upsert)
        if (flights.length > 0) {
            const operations = flights.map(flight => ({
                updateOne: {
                    filter: { flightId: flight.flightId },
                    update: { $set: flight },
                    upsert: true
                }
            }));

            Flight.bulkWrite(operations).catch(err => console.error('Mongo Save Error:', err));
        }

        return flights;

    } catch (error) {
        console.error('Error fetching from OpenSky:', error.message);
        return [];
    }
};

module.exports = { fetchFlightData };
