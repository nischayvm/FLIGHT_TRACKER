import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { socket } from '../services/socket';
import FlightSidebar from './FlightSidebar';

// SVG Plane Icon Function
const createPlaneIcon = (heading, isSelected) => {
    // Simple, sharp commercial plane SVG
    const svg = `
    <svg viewBox="0 0 24 24" fill="${isSelected ? '#00f2ff' : 'white'}" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0 4px ${isSelected ? '#00f2ff' : 'rgba(0,0,0,0.5)'});">
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
  `;

    return L.divIcon({
        className: `plane-icon ${isSelected ? 'selected' : ''}`,
        html: `<div style="transform: rotate(${heading - 90}deg); width: 100%; height: 100%;">${svg}</div>`, // -90 deg adjustment if SVG points up/right
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

// Component to handle Map Motion
const FlyToFlight = ({ selectedFlight }) => {
    const map = useMap();

    useEffect(() => {
        if (selectedFlight) {
            map.flyTo([selectedFlight.latitude, selectedFlight.longitude], 10, {
                animate: true,
                duration: 1.5
            });
        }
    }, [selectedFlight, map]);

    return null;
};

const FlightMap = () => {
    const [flights, setFlights] = useState([]);
    const [selectedFlight, setSelectedFlight] = useState(null);

    useEffect(() => {
        socket.on('flightUpdates', (updatedFlights) => {
            setFlights(updatedFlights);
        });
        return () => {
            socket.off('flightUpdates');
        };
    }, []);

    return (
        <div style={{ height: '100vh', width: '100vw', position: 'relative', overflow: 'hidden' }}>
            <MapContainer
                center={[15.3173, 75.7139]}
                zoom={7}
                style={{ height: '100%', width: '100%', outline: 'none', background: '#0f172a' }}
                zoomControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    className="dark-map-layer"
                />

                <FlyToFlight selectedFlight={selectedFlight} />

                {flights.map((flight) => {
                    const isSelected = selectedFlight?.flightId === flight.flightId;
                    return (
                        <Marker
                            key={flight.flightId}
                            position={[flight.latitude, flight.longitude]}
                            icon={createPlaneIcon(flight.heading, isSelected)}
                            eventHandlers={{
                                click: () => setSelectedFlight(flight),
                            }}
                            zIndexOffset={isSelected ? 1000 : 0}
                        />
                    );
                })}
            </MapContainer>

            <FlightSidebar
                flights={flights}
                selectedFlight={selectedFlight}
                onSelectFlight={setSelectedFlight}
                onClose={() => setSelectedFlight(null)}
            />
        </div>
    );
};

export default FlightMap;
