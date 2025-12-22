import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const LocationInput = ({ label, value, setTextValue, onSelect, placeholder }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (value && value.length > 2 && showDropdown) {
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${value}, Karnataka, India&limit=5`, {
                        headers: { 'Accept-Language': 'en' }
                    });
                    setSuggestions(res.data);
                } catch (e) {
                    console.error(e);
                }
            } else if (!value) {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [value, showDropdown]);

    const handleSelect = (item) => {
        setTextValue(item.display_name); // Update text input
        onSelect({
            name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon)
        });
        setShowDropdown(false);
    };

    return (
        <div className="input-group" style={{ position: 'relative' }}>
            <label>{label}</label>
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => {
                    setTextValue(e.target.value);
                    setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                // Delay blur to allow click on dropdown
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            />
            {showDropdown && suggestions.length > 0 && (
                <ul className="suggestions-dropdown">
                    {suggestions.map((item) => (
                        <li key={item.place_id} onClick={() => handleSelect(item)}>
                            {item.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const Sidebar = ({ source, setSource, destination, setDestination, vehicle, setVehicle, onCalculate, routeStats }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Karnataka Tolls Project</h2>
            </div>

            <LocationInput
                label="From"
                placeholder="Search Place (e.g. Bangalore)"
                value={source.name}
                setTextValue={(text) => setSource({ ...source, name: text })}
                onSelect={(location) => setSource(location)}
            />

            <LocationInput
                label="To"
                placeholder="Search Place (e.g. Hubli)"
                value={destination.name}
                setTextValue={(text) => setDestination({ ...destination, name: text })}
                onSelect={(location) => setDestination(location)}
            />

            <div className="input-group">
                <label>Vehicle Class</label>
                <div className="vehicle-toggle">
                    <button
                        className={vehicle === 'car' ? 'active' : ''}
                        onClick={() => setVehicle('car')}
                    >
                        🚗 Car
                    </button>
                    <button
                        className={vehicle === 'bike' ? 'active' : ''}
                        onClick={() => setVehicle('bike')}
                    >
                        🏍️ Bike
                    </button>
                </div>
            </div>

            <button className="calculate-btn" onClick={() => {
                console.log("Calculate button clicked");
                onCalculate();
            }}>
                Calculate Routes
            </button>

            {routeStats && (
                <div className="results">
                    <h3>Route Comparison</h3>

                    {/* Check if we have comparison data or single route */}
                    {routeStats.standard ? (
                        <>
                            <div className="route-comparison-card standard">
                                <h4>🔵 Standard Route</h4>
                                <div className="stat-row"><span>Time:</span> <strong>{routeStats.standard.time} min</strong></div>
                                <div className="stat-row"><span>Dist:</span> <strong>{routeStats.standard.distance} km</strong></div>
                                <div className="stat-row"><span>Toll:</span> <strong>₹{routeStats.standard.cost}</strong></div>
                            </div>
                            <div className="route-comparison-card optimal">
                                <h4>🟢 Optimal (No Toll)</h4>
                                <div className="stat-row"><span>Time:</span> <strong>{routeStats.optimal.time} min</strong></div>
                                <div className="stat-row"><span>Dist:</span> <strong>{routeStats.optimal.distance} km</strong></div>
                                <div className="stat-row"><span>Toll:</span> <strong>₹{routeStats.optimal.cost}</strong></div>
                            </div>
                            {/* Savings calculation */}
                            <div className="savings-card">
                                <span>Savings:</span> <strong>₹{routeStats.standard.cost - routeStats.optimal.cost}</strong>
                                <span style={{ fontSize: '0.8em', display: 'block' }}>Extra Time: {routeStats.optimal.time - routeStats.standard.time} min</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stat-card">
                                <span>🕑 Time</span>
                                <strong>{routeStats.time} mins</strong>
                            </div>
                            <div className="stat-card">
                                <span>📏 Distance</span>
                                <strong>{routeStats.distance} km</strong>
                            </div>
                            <div className="stat-card highlight">
                                <span>💰 Toll Cost</span>
                                <strong>₹{routeStats.cost}</strong>
                            </div>
                        </>
                    )}

                    <button
                        className="google-maps-btn"
                        onClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&origin=${source.lat},${source.lng}&destination=${destination.lat},${destination.lng}&travelmode=${vehicle === 'bike' ? 'two_wheeler' : 'driving'}`;
                            window.open(url, '_blank');
                        }}
                    >
                        Open in Google Maps ↗
                    </button>
                </div>
            )}

            <div className="footer">
                <p>Data Covers Karnataka</p>
            </div>
        </div>
    );
};

export default Sidebar;
