require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const { fetchFlightData } = require('./services/flightDataService');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for dev
        methods: ["GET", "POST"]
    }
});

// Connect to Database
connectDB();

// Polling Interval (OpenSky rate limit is generous but let's be polite: 10 seconds)
const POLLING_INTERVAL = 10000;

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Flight Data Polling Loop
const startFlightSimulation = () => {
    console.log('Starting Flight Data Polling Service...');

    setInterval(async () => {
        console.log('Fetching live flight data...');
        const flights = await fetchFlightData();

        if (flights.length > 0) {
            // Broadcast to all connected clients
            io.emit('flightUpdates', flights);
            console.log(`Emitted ${flights.length} flights`);
        }
    }, POLLING_INTERVAL);
};

startFlightSimulation();

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
