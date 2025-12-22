import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

const RouteRenderer = ({ source, destination, vehicle, setRouteStats, tollGates }) => {
    const map = useMap();
    const [standardRoute, setStandardRoute] = useState(null);
    const [optimalRoute, setOptimalRoute] = useState(null);

    useEffect(() => {
        if (!source || !destination || !map) return;

        const fetchRoutes = async () => {
            try {
                // 1. Standard Route (Fastest, usually includes tolls)
                const stdUrl = `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
                const stdRes = await axios.get(stdUrl);

                let stdData = null;
                if (stdRes.data.routes && stdRes.data.routes.length > 0) {
                    const route = stdRes.data.routes[0];
                    stdData = {
                        coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), // Flip to [lat, lng]
                        distance: (route.distance / 1000).toFixed(2), // km
                        duration: (route.duration / 60).toFixed(0), // min
                        rawCoordinates: route.geometry.coordinates // [lng, lat] for OSRM
                    };
                }

                // 2. Optimal Route (Exclude Tolls)
                const optUrl = `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&exclude=toll`;
                const optRes = await axios.get(optUrl);

                let optData = null;
                if (optRes.data.routes && optRes.data.routes.length > 0) {
                    const route = optRes.data.routes[0];
                    optData = {
                        coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]),
                        distance: (route.distance / 1000).toFixed(2),
                        duration: (route.duration / 60).toFixed(0),
                        rawCoordinates: route.geometry.coordinates
                    };
                }

                // Calculate Toll Costs
                const calculateCost = (routeCoords) => {
                    if (!routeCoords) return 0;
                    let cost = 0;
                    // For each toll gate, check if route passes near it (simple proximity check)
                    // Optimization: Check if toll gate is roughly between source and dest bounds? 
                    // Or just iterate all tolls (since N is small < 100)

                    if (tollGates && tollGates.length > 0) {
                        tollGates.forEach(gate => {
                            // Check if any point on route is within ~250m of a toll gate
                            // This is expensive for long routes with many points.
                            // Sampling points or spatial index would be better.
                            // For prototype, we'll check every 10th point or if the gate is 'on' the path.

                            // Let's use a simple bounding box check first

                            const isNear = routeCoords.some((coord, index) => {
                                if (index % 5 !== 0) return false; // Optimization: check every 5th point
                                const dist = map.distance(coord, [gate.location.lat, gate.location.lng]);
                                return dist < 250; // 250 meters
                            });

                            if (isNear) {
                                cost += vehicle === 'bike' ? (gate.cost.bike || 0) : (gate.cost.car || 0);
                            }
                        });
                    }
                    return cost;
                };

                const stdCost = stdData ? calculateCost(stdData.coordinates) : 0;
                const optCost = optData ? calculateCost(optData.coordinates) : 0;

                setStandardRoute(stdData);
                setOptimalRoute(optData);

                // Update Stats in Parent
                setRouteStats({
                    standard: stdData ? { ...stdData, cost: stdCost } : null,
                    optimal: optData ? { ...optData, cost: optCost } : null
                });

                // Fit bounds to show both routes
                if (stdData) {
                    const bounds = L.latLngBounds(stdData.coordinates);
                    if (optData) {
                        bounds.extend(optData.coordinates);
                    }
                    map.fitBounds(bounds, { padding: [50, 50] });
                }

            } catch (error) {
                console.error("Error fetching routes:", error);
                alert("Failed to find route. OSRM might be busy or unreachable.");
            }
        };

        fetchRoutes();

    }, [source, destination, vehicle, map, setRouteStats, tollGates]);

    return (
        <>
            {/* Standard Route - Blue */}
            {standardRoute && (
                <Polyline
                    positions={standardRoute.coordinates}
                    pathOptions={{ color: '#2563EB', weight: 6, opacity: 0.7 }}
                >
                    <Popup>Standard Route (Fastest)</Popup>
                </Polyline>
            )}

            {/* Optimal/Toll-Free Route - Green */}
            {optimalRoute && (
                <Polyline
                    positions={optimalRoute.coordinates}
                    pathOptions={{ color: '#10B981', weight: 6, opacity: 0.9, dashArray: '10, 10' }}
                >
                    <Popup>Optimal Route (No Tolls)</Popup>
                </Polyline>
            )}

            {/* Start/End Markers */}
            {source && <Marker position={[source.lat, source.lng]}><Popup>Start: {source.name}</Popup></Marker>}
            {destination && <Marker position={[destination.lat, destination.lng]}><Popup>End: {destination.name}</Popup></Marker>}
        </>
    );
};

const MapComponent = ({ source, destination, vehicle, setRouteStats, tollGates }) => {
    // Center of Karnataka
    const center = { lat: 15.3173, lng: 75.7139 };

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Markers for Toll Gates */}
                {tollGates.map((gate) => (
                    <Marker
                        key={gate._id}
                        position={[gate.location.lat, gate.location.lng]}
                        eventHandlers={{
                            click: () => {
                                alert(`${gate.name}\nCar: ₹${gate.cost.car}\nBike: ₹${gate.cost.bike}`);
                            }
                        }}
                    />
                ))}

                {source && destination && (
                    <RouteRenderer
                        source={source}
                        destination={destination}
                        vehicle={vehicle}
                        setRouteStats={setRouteStats}
                        tollGates={tollGates}
                    />
                )}
            </MapContainer>
        </div>
    );
};

export default MapComponent;
