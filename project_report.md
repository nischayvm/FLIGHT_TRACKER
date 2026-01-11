# Flight Tracker: Definitive Technical Guide

## 1. System Architecture & Design Philosophy

The **Flight Tracker** is a distributed real-time system designed to visualize high-frequency geospatial data. It adopts a **Producer-Consumer** architecture decoupled by a persistent data store.

### 1.1 The "Poll-Push" Pattern
Real-time apps usually choose between WebSockets (Push) and Polling (Pull). We use a hybrid:
1.  **Poll (Backend -> API)**: The backend *pulls* from OpenSky every 10 seconds.
2.  **Push (Backend -> Client)**: The backend *pushes* updates to clients via WebSockets immediately after processing.

**Why this approach?**
*   **API Limits**: OpenSky has strict rate limits. If every client fetched data individually, we'd be banned instantly.
*   **Single Source of Truth**: The server acts as a centralized proxy, caching the state of the sky. 1000 users see the same plane at the exact same location.

### 1.2 Architecture Diagram
```mermaid
graph TD
    subgraph "External World"
        OS[OpenSky Network API]
    end

    subgraph "Backend Infrastructure"
        Service[Flight Data Service]
        Timer["Polling Interval (10s)"]
        DB[(MongoDB Persistence)]
        Socket[Socket.IO Server]
    end

    subgraph "Frontend Client"
        Store[Local React State]
        Map[Leaflet Map Renderer]
        UI[Sidebar & Overlay]
    end

    Timer -->|Trigger| Service
    Service -->|HTTP GET| OS
    OS -->|Raw Flight Arrays| Service
    Service -->|Transform & Normalize| Service
    Service -->|Upsert (Update/Insert)| DB
    Service -->|Emit 'flightUpdates'| Socket
    Socket -->|WebSocket Packet| Store
    Store -->|Re-render| Map
    Store -->|Update| UI
```

---

## 2. Backend Implementation Details

### 2.1 The Polling Engine (`server.js`)
The server is stateful. It maintains a continuous heartbeat loop using `setInterval`.

```javascript
// The Heartbeat
const POLLING_INTERVAL = 10000; // 10 seconds

setInterval(async () => {
    // 1. Fetch
    const flights = await fetchFlightData();
    
    // 2. Broadcast (Only if data exists)
    if (flights.length > 0) {
        io.emit('flightUpdates', flights);
    }
}, POLLING_INTERVAL);
```

**Critical Detail - `io.emit` vs `socket.emit`**:
*   `socket.emit`: Sends to *one* specific client (e.g., "Welcome user A").
*   `io.emit`: Broadcasts to *everyone*. We use this because flight data is global; everyone sees the same sky.

### 2.2 Data Transformation (`flightDataService.js`)
External APIs often return optimized, compressed arrays to save bandwidth. Our job is to hydrate this into semantic JSON.

**The Mapping**:
OpenSky returns: `["4b1812", "IGO65", "India", 1678123, 1678123, 75.12, 12.34, ...]`
We transform to:
```javascript
{
    flightId: state[0],       // "4b1812" - Immutable unique ID
    callsign: state[1],       // "IGO65" - Commercial ID
    longitude: state[5],      // 75.12
    latitude: state[6],       // 12.34
    heading: state[10]        // 145° - Crucial for icon rotation
}
```
*Why?* Frontend code reading `flight.latitude` is readable; `flight[6]` is unmaintainable magic code.

### 2.3 Database Strategy: The "Upsert"
We use **MongoDB** not just for logging, but as a live cache.

**The Problem**: Planes move. We don't want duplicate rows for "Flight IGO65 at 10:00:01" and "Flight IGO65 at 10:00:11".
**The Solution**: `bulkWrite` with `upsert: true`.

```javascript
updateOne: {
    filter: { flightId: "4b1812" }, // Find the plane
    update: { $set: newData },      // Update its location
    upsert: true                    // If not found, create it
}
```
This ensures our database size grows with *distinct planes*, not *time*.

---

## 3. Frontend Internal Logic

### 3.1 State Synchronization
The frontend is reactive. It doesn't ask "Are there new planes?". It waits to be told.

**Hook logic (`useEffect`)**:
```javascript
useEffect(() => {
    // Listener
    socket.on('flightUpdates', (updatedFlights) => {
        setFlights(updatedFlights); // Triggers Re-render
    });

    // Cleanup (Crucial!)
    return () => socket.off('flightUpdates');
}, []);
```
*Why Cleanup?* Use `socket.off` prevents memory leaks. If the user navigated away and returned, we'd have two listeners processing the same event, causing double-renders or errors.

### 3.2 Geospatial Visualization (`FlightMap.jsx`)
We use **Leaflet** because it handles coordinate projection (Spherical Earth -> Flat Screen) automatically.

**The "FlyTo" Animation**:
When a user clicks a flight, we don't just "jump" there. We smoothly animate the camera.
```javascript
map.flyTo([lat, lon], 10, {
    animate: true,
    duration: 1.5 // Seconds
});
```
This provides context. The user sees *where* on the map they are moving to, maintaining spatial awareness.

### 3.3 CSS Architecture & Glassmorphism
The UI looks premium because of specific CSS properties (in `index.css` / `App.css`):

1.  **Backdrop Filter**: `backdrop-filter: blur(12px);` - This blurs the map *behind* the sidebar, making the text readable while keeping the context of the map visible.
2.  **Translucency**: `background: rgba(15, 23, 42, 0.75);` - A dark navy theme with 75% opacity.
3.  **Neon Accents**: `box-shadow: 0 0 15px rgba(0, 242, 255, 0.3);` - Used on the selected plane to make it "pop" against the dark map.

---

## 4. Resilience & Error Handling

### 4.1 What if the API fails?
*   **Scenario**: OpenSky is down or rate-limits us.
*   **Handling**: The `fetchFlightData` function wraps the Axios call in a `try...catch`.
*   **Result**: It returns an empty array `[]` and logs the error. The server process *continues*. It does **not crash**.
*   **Client Experience**: The client simply receives no update for that 10-second tick. The planes stop moving, but the app remains responsive.

### 4.2 What if the User disconnects?
*   **Socket.io**: Automatically detects `disconnect` event.
*   **Server**: Logs "Client disconnected". accurately cleaning up resources associated with that socket connection.

---

## 5. Scalability Considerations

If this app went viral (100,000 users):
1.  **The Bottleneck**: It is **NOT** the API polling (that's constant 1 request/10s regardless of users). It is the **Socket Broadcast**. Sending 100kb of JSON to 100k users constant is huge bandwidth.
2.  **Solution**:
    *   **Binary Protobufs**: Replace JSON with Protobuf to compress payload size by 80%.
    *   **Delta Updates**: Only send *changes* (e.g., "Plane A moved +0.01 Lat"), not the whole object.
    *   **Redis Adapter**: Use Socket.io Redis Adapter to spread the connection load across multiple server instances.

---

## 6. How to Explain This Project (Elevator Pitch)
"Calculated precision meets beautiful design. We built a system that autonomously monitors Karnataka's airspace, ingesting complex telemetry data, normalizing it in a persistent database, and broadcasting it in real-time to a high-performance React frontend. It allows users to track aircraft movement with zero latency between the server noticing a change and the user seeing it."
