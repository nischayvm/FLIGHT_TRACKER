import React from 'react';

const FlightSidebar = ({ flights, selectedFlight, onSelectFlight, onClose }) => {
    return (
        <div className="sidebar glass-panel">
            <div className="sidebar-header">
                <h2>✈️ Live Radar</h2>
                <span className="live-badge">LIVE</span>
            </div>

            <div className="stats-row">
                <div className="stat-card">
                    <span className="stat-label">Active</span>
                    <span className="stat-value">{flights.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Region</span>
                    <span className="stat-value">Karnataka</span>
                </div>
            </div>

            {/* Flight List - Flex Grow to fill space */}
            <div className="flight-list-container">
                <h3>Active Flights ({flights.length})</h3>
                {flights.length === 0 ? (
                    <div className="empty-state">No active flights in range.</div>
                ) : (
                    <div className="flight-list">
                        {flights.map(flight => (
                            <div
                                key={flight.flightId}
                                className={`flight-item ${selectedFlight?.flightId === flight.flightId ? 'active' : ''}`}
                                onClick={() => onSelectFlight(flight)}
                            >
                                <div className="flight-icon">✈</div>
                                <div className="flight-info-row">
                                    <span className="flight-callsign">{flight.callsign || 'N/A'}</span>
                                    <span className="flight-country">{flight.country}</span>
                                    <span className="flight-sub">{flight.velocity?.toFixed(0)} m/s</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedFlight && (
                <div className="flight-details fade-in">
                    <div className="details-header">
                        <h3>{selectedFlight.callsign || 'N/A'}</h3>
                        <button onClick={onClose} className="close-btn">×</button>
                    </div>

                    <div className="details-grid">
                        <DetailItem label="Country" value={selectedFlight.country} />
                        <DetailItem label="Altitude" value={`${selectedFlight.altitude?.toFixed(0) || '-'} m`} />
                        <DetailItem label="Velocity" value={`${selectedFlight.velocity?.toFixed(0) || '-'} m/s`} />
                        <DetailItem label="Heading" value={`${selectedFlight.heading?.toFixed(0) || '-'}°`} />
                        <DetailItem label="Lat/Lon" value={`${selectedFlight.latitude?.toFixed(2)}, ${selectedFlight.longitude?.toFixed(2)}`} />
                        <DetailItem label="ICAO24" value={selectedFlight.flightId} />
                    </div>
                </div>
            )}

            <div className="footer">
                <p>Data: OpenSky Network</p>
            </div>
        </div>
    );
};

const DetailItem = ({ label, value }) => (
    <div className="detail-item">
        <label>{label}</label>
        <span>{value}</span>
    </div>
);

export default FlightSidebar;
