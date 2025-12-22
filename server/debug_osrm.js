async function test() {
    try {
        console.log("Geocoding Bangalore...");
        const srcRes = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=Bangalore, Karnataka, India');
        if (!srcRes.ok) throw new Error(`Geocode failed: ${srcRes.status}`);
        const srcData = await srcRes.json();
        const src = srcData[0];
        console.log("Source:", src.lat, src.lon);

        console.log("Geocoding Mysore...");
        const destRes = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=Mysore, Karnataka, India');
        if (!destRes.ok) throw new Error(`Geocode failed: ${destRes.status}`);
        const destData = await destRes.json();
        const dest = destData[0];
        console.log("Dest:", dest.lat, dest.lon);

        const sLat = parseFloat(src.lat); // ~12
        const sLng = parseFloat(src.lon); // ~77
        const dLat = parseFloat(dest.lat);
        const dLng = parseFloat(dest.lon);

        // OSRM expects lng,lat
        const url = `https://router.project-osrm.org/route/v1/driving/${sLng},${sLat};${dLng},${dLat}?overview=full&geometries=geojson`;
        console.log("Testing OSRM URL:", url);

        const osrmRes = await fetch(url);
        console.log("OSRM Status:", osrmRes.status);
        if (osrmRes.ok) {
            const data = await osrmRes.json();
            console.log("Route found:", data.routes && data.routes.length > 0);
        } else {
            const text = await osrmRes.text();
            console.error("OSRM Error Body:", text);
        }

    } catch (e) {
        console.error("Setup failed:", e.message);
    }
}

test();
