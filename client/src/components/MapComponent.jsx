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
                let stdUrl, optUrl;

                // Use GeoJSON to avoid needing extra polyline library
                if (vehicle === 'car') {
                    stdUrl = `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
                    // Try optimal route, maybe it works, maybe it fails 400
                    optUrl = `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson&exclude=toll`;
                } else {
                    stdUrl = `https://router.project-osrm.org/route/v1/driving/${source.lng},${source.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
                }

                // Calculate Toll logic
                const calculateToll = (routeCoords) => {
                    if (!routeCoords || !tollGates || tollGates.length === 0) return 0;
                    let cost = 0;
                    tollGates.forEach(gate => {
                        // Simple optimization: check every 10th point
                        const isNear = routeCoords.some((coord, index) => {
                            if (index % 10 !== 0) return false;
                            const dist = map.distance(coord, [gate.location.lat, gate.location.lng]);
                            return dist < 500; // Increased radius to 500m to be safe
                        });
                        if (isNear) {
                            cost += vehicle === 'bike' ? (gate.cost.bike || 0) : (gate.cost.car || 0);
                        }
                    });
                    return cost;
                };

                const results = await Promise.allSettled([
                    axios.get(stdUrl),
                    (vehicle === 'car' && optUrl) ? axios.get(optUrl) : Promise.resolve(null)
                ]);

                const stdResult = results[0];
                const optResult = results[1];

                if (stdResult.status === 'rejected') {
                    console.error("Standard route failed:", stdResult.reason);
                    alert("Failed to find route. OSRM might be busy or unreachable.");
                    return;
                }

                const stdRes = stdResult.value;
                const optRes = (optResult.status === 'fulfilled') ? optResult.value : null;

                if (optResult.status === 'rejected') {
                    console.warn("Optimal route failed (likely not supported):", optResult.reason);
                }

                if (!stdRes.data.routes || stdRes.data.routes.length === 0) {
                    alert("No route found!");
                    return;
                }

                // Process Standard Route
                const mainRoute = stdRes.data.routes[0];
                // GeoJSON coordinates are [lng, lat]. Leaflet needs [lat, lng].
                const stdPath = mainRoute.geometry.coordinates.map(c => [c[1], c[0]]);

                const stdData = {
                    coordinates: stdPath,
                    distance: (mainRoute.distance / 1000).toFixed(2),
                    duration: (mainRoute.duration / 60).toFixed(0),
                    cost: calculateToll(stdPath)
                };
                setStandardRoute(stdData);

                // Process Optimal Route
                let optData = null;
                if (optRes && optRes.data.routes.length > 0) {
                    const altRoute = optRes.data.routes[0];
                    const optPath = altRoute.geometry.coordinates.map(c => [c[1], c[0]]);

                    optData = {
                        coordinates: optPath,
                        distance: (altRoute.distance / 1000).toFixed(2),
                        duration: (altRoute.duration / 60).toFixed(0),
                        cost: calculateToll(optPath)
                    };
                    setOptimalRoute(optData);
                } else {
                    setOptimalRoute(null);
                }

                // Calculate Finances
                const stdFuel = (stdData.distance / 15 * 105).toFixed(0);
                const stdTotal = stdData.cost + parseFloat(stdFuel);

                let stats = {
                    distance: stdData.distance,
                    duration: stdData.duration,
                    tollCost: stdData.cost,
                    fuelCost: stdFuel,
                    totalCost: stdTotal
                };

                if (optData) {
                    const optFuel = (optData.distance / 15 * 105).toFixed(0);
                    const optTotal = optData.cost + parseFloat(optFuel);

                    // Only show optimal if it saves money
                    if (optTotal < stdTotal) {
                        stats.optimal = {
                            distance: optData.distance,
                            duration: optData.duration,
                            tollCost: optData.cost,
                            fuelCost: optFuel,
                            totalCost: optTotal,
                            savings: (stdTotal - optTotal).toFixed(0)
                        };
                    }
                }

                setRouteStats(stats);

                // Fit bounds
                if (map && stdPath.length > 0) {
                    const bounds = L.latLngBounds(stdPath);
                    if (optData) bounds.extend(optData.coordinates);
                    map.fitBounds(bounds, { padding: [50, 50] });
                }

            } catch (error) {
                console.error("Error processing routes:", error);
                alert("An error occurred while calculating the route.");
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
