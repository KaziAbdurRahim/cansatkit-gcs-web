import React, { useState, useEffect } from "react";
import axios from "axios";

// 📁 Utility: Export sensor log as CSV file
const exportToCSV = (data, filename = "cansat_log.csv") => {
  if (!data || data.length === 0) return;

  // Define CSV headers
  const headers = [
    "altitude",
    "pressure",
    "temperature",
    "humidity",
    "battery",
    "compass",
    "latitude",
    "longitude",
    "satellites",
    "time",
  ];

  // Format each row based on headers
  const csvRows = data.map((row) =>
    headers.map((header) => row[header] || "").join(",")
  );

  // Combine headers and rows into CSV string
  const csvContent = headers.join(",") + "\n" + csvRows.join("\n");

  // Create downloadable blob and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DashBoard02 = () => {
  // 🧠 State: IP address of ESP32
  const [ip, setIp] = useState("");

  // 🔌 State: Connection status
  const [connected, setConnected] = useState(false);

  // 📡 State: Latest sensor data from ESP32
  const [sensorData, setSensorData] = useState({});

  // 🧾 State: Historical log of all received data
  const [logData, setLogData] = useState([]);

  // ⏱️ State: Interval ID for polling
  const [intervalId, setIntervalId] = useState(null);

  // 🔁 Function: Connect or disconnect from ESP32
  const toggleConnection = async () => {
    if (connected) {
      // Disconnect logic
      clearInterval(intervalId);
      setConnected(false);
      setSensorData({});
      return;
    }

    // Attempt to connect to ESP32 via /connect route
    try {
      const res = await axios.get(`http://${ip}/connect`);
      if (res.data.connected) {
        setConnected(true);
        startPolling(); // Begin data polling
      } else {
        alert("ESP32 did not confirm connection.");
      }
    } catch (err) {
      alert("Connection failed. Check IP and network.");
    }
  };

  // 🔄 Function: Poll ESP32 every second for sensor data
  const startPolling = () => {
    const id = setInterval(async () => {
      try {
        const res = await axios.get(`http://${ip}/data`);
        const timestampedData = {
          ...res.data,
          time: new Date().toISOString(), // Add timestamp on dashboard side
        };
        setSensorData(timestampedData); // Update live view
        setLogData((prev) => [...prev, timestampedData]); // Append to log
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000);
    setIntervalId(id);
  };

  // 🧹 Cleanup: Stop polling when component unmounts
  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  // 💾 Function: Trigger CSV download of log data
  const handleLogDownload = () => {
    if (logData.length === 0) {
      alert("No data to save.");
      return;
    }
    exportToCSV(logData);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-6">
      {/* 🏷️ Title */}
      <h1 className="text-2xl font-bold mb-4">
        BRACU Diganta CanSat Learning Kit
      </h1>

      {/* 🌐 IP Input + Connect Button */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Enter ESP32 IP (e.g. 192.168.0.123)"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="px-3 py-2 rounded text-white border-2"
        />
        <button
          onClick={toggleConnection}
          className={`px-4 py-2 rounded ${
            connected ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
      </div>

      {/* 🔍 Connection Status */}
      <p className="mb-4">
        Status:{" "}
        <span className={connected ? "text-green-400" : "text-red-400"}>
          {connected ? "✅ Connected" : "❌ Not Connected"}
        </span>
      </p>

      {/* 📊 Sensor Data Display */}
      <div className="grid grid-cols-2 gap-4 bg-gray-800 p-4 rounded-lg mb-4">
        <div>Altitude: {sensorData.altitude || "-"} m</div>
        <div>Temperature: {sensorData.temperature || "-"} °C</div>
        <div>Pressure: {sensorData.pressure || "-"} hPa</div>
        <div>Humidity: {sensorData.humidity || "-"} %</div>
        <div>Battery: {sensorData.battery || "-"} %</div>
        <div>Compass: {sensorData.compass || "-"}</div>
      </div>

      {/* 🧭 GPS Data Display */}
      <div className="bg-gray-800 p-4 rounded-lg mb-4 w-full max-w-md">
        <h2 className="font-semibold mb-2">📡 GPS Data</h2>
        <p>Latitude: {sensorData.latitude || "-"}</p>
        <p>Longitude: {sensorData.longitude || "-"}</p>
        <p>Satellites: {sensorData.satellites || "-"}</p>
        <p>Time (UTC): {sensorData.time || "-"}</p>
      </div>

      {/* 📥 Log Download Button */}
      <button
        onClick={handleLogDownload}
        className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
      >
        Log Data (CSV)
      </button>
    </div>
  );
};

export default DashBoard02;
