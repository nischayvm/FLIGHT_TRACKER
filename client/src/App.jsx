import { useState, useEffect } from 'react';
import axios from 'axios';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import './index.css';

function App() {
  const [source, setSource] = useState({ name: '', lat: null, lng: null });
  const [destination, setDestination] = useState({ name: '', lat: null, lng: null });
  const [vehicle, setVehicle] = useState('car');
  const [routeStats, setRouteStats] = useState(null);
  const [tollGates, setTollGates] = useState([]);

  // Fetch Tolls
  useEffect(() => {
    // Replace with your actual IP if testing on mobile or network
    // Use environment variable for API URL (defaults to localhost if not set)
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    axios.get(`${apiUrl}/api/tolls`)
      .then(res => setTollGates(res.data))
      .catch(err => console.error(err));
  }, []);

  const geocode = async (query) => {
    if (!query) return null;
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${query + ', Karnataka, India'}`);
      if (res.data && res.data.length > 0) {
        return {
          lat: parseFloat(res.data[0].lat),
          lng: parseFloat(res.data[0].lon),
          name: res.data[0].display_name
        };
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleCalculate = async () => {
    console.log("handleCalculate called", { source, destination });
    if (!source.name || !destination.name) {
      console.log("Missing source or destination name");
      alert("Please enter both locations");
      return;
    }

    // Geocode both
    console.log("Geocoding source...");
    const srcCoords = await geocode(source.name);
    console.log("Source coords:", srcCoords);

    console.log("Geocoding destination...");
    const destCoords = await geocode(destination.name);
    console.log("Destination coords:", destCoords);

    if (srcCoords && destCoords) {
      console.log("Updating state with new coords");
      setSource({ ...source, ...srcCoords });
      setDestination({ ...destination, ...destCoords });
    } else {
      console.error("Geocoding failed for one or both locations");
      alert("Could not find one of the locations");
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        source={source}
        setSource={setSource}
        destination={destination}
        setDestination={setDestination}
        vehicle={vehicle}
        setVehicle={setVehicle}
        onCalculate={handleCalculate}
        routeStats={routeStats}
      />
      <div className="map-wrapper">
        <MapComponent
          source={source.lat ? source : null}
          destination={destination.lat ? destination : null}
          vehicle={vehicle}
          setRouteStats={setRouteStats}
          tollGates={tollGates}
        />
      </div>
    </div>
  );
}

export default App;
