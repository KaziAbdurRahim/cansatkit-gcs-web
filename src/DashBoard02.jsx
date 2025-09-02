import React, { useState, useEffect } from "react";
import axios from "axios";

// -----------------------------------------------------------------------------
// 📁 Utility Function: Export logged data as CSV
// -----------------------------------------------------------------------------
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
    "esp32Time",
    "dashboardTime",
  ];

  // Format each row
  const csvRows = data.map((row) =>
    headers.map((header) => row[header] || "").join(",")
  );

  // Build CSV file content
  const csvContent = headers.join(",") + "\n" + csvRows.join("\n");

  // Create a downloadable file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// -----------------------------------------------------------------------------
// 📊 React Component: DashBoard02
// -----------------------------------------------------------------------------
const DashBoard02 = () => {
  // 🔹 State Variables
  const [ip, setIp] = useState(""); // ESP32 IP address
  const [connected, setConnected] = useState(false); // Connection status
  const [sensorData, setSensorData] = useState({}); // Latest ESP32 data
  const [logData, setLogData] = useState([]); // Historical log
  const [intervalId, setIntervalId] = useState(null); // Polling interval

  // ---------------------------------------------------------------------------
  // 🔌 Function: Connect or Disconnect from ESP32
  // ---------------------------------------------------------------------------
  const toggleConnection = async () => {
    if (connected) {
      // Disconnect
      clearInterval(intervalId);
      setConnected(false);
      setSensorData({});
      return;
    }

    try {
      // Try to connect to ESP32
      const res = await axios.get(`http://${ip}/connect`);
      if (res.data.connected) {
        setConnected(true);
        startPolling(); // Start fetching data
      } else {
        alert("ESP32 did not confirm connection.");
      }
    } catch (err) {
      alert("Connection failed. Check IP and network.");
    }
  };

  // ---------------------------------------------------------------------------
  // ⏱️ Function: Poll ESP32 every second for sensor data
  // ---------------------------------------------------------------------------
  const startPolling = () => {
    const id = setInterval(async () => {
      try {
        const res = await axios.get(`http://${ip}/data`);

        // Add both ESP32-provided time and dashboard logging time
        const timestampedData = {
          ...res.data,
          esp32Time: res.data.time,
          dashboardTime: new Date().toISOString(),
        };

        setSensorData(timestampedData); // Show latest data
        setLogData((prev) => [...prev, timestampedData]); // Append to history
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000);

    setIntervalId(id);
  };

  // ---------------------------------------------------------------------------
  // 🧹 Cleanup: Stop polling when component unmounts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  // ---------------------------------------------------------------------------
  // 💾 Function: Download logged data as CSV
  // ---------------------------------------------------------------------------
  const handleLogDownload = () => {
    if (logData.length === 0) {
      alert("No data to save.");
      return;
    }
    exportToCSV(logData);
  };

  // ---------------------------------------------------------------------------
  // 🖼️ UI Rendering
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-6">
      {/* 🏷️ Title */}
      <h1 className="text-2xl font-bold mb-4 text-center">
        BRACU Diganta CanSat Learning Kit
      </h1>

      {/* 🌐 IP Input + Connect Button */}
      <div className="items-center flex gap-2 mb-2 text-sm text-center">
        <input
          type="text"
          placeholder="EnterEsp32 IP:192.168.0.123"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="px-1 py-1 rounded text-white border-2"
        />
        <button
          onClick={toggleConnection}
          className={`px-1 py-1 rounded ${
            connected ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
        {/* 🔍 Connection Status */}
        <div className=" items-center">
          {" "}
          <p className="mb-1 text-sm ">
            Status:{" "}
            <span className={connected ? "text-green-400" : "text-red-400"}>
              {connected ? "✅ " : "❌ "}
            </span>
          </p>
        </div>
      </div>

      {/* Command panel */}
      <div className="flex gap-1 mb-1">
        <div>
          {" "}
          <button className="px-1 py-1 rounded text-sm bg-green-300">
            log
          </button>
        </div>
        <div>
          {" "}
          <button className="px-1 py-1 rounded text-sm bg-blue-500">
            Reset
          </button>
        </div>
        <div>
          {" "}
          <button className="px-1 py-1 rounded text-sm bg-yellow-600">
            Calibrate
          </button>
        </div>
        <div>
          {" "}
          <button className="px-1 py-1 rounded text-sm bg-amber-800">
            kkk
          </button>
        </div>
      </div>

      {/* 📊 Sensor Data */}
      <div className="grid grid-cols-2 gap-2  rounded-lg mb-4 ">
        <div className="bg-gray-800 p-1 rounded">
          <span className="text-cyan-200 font-semibold"> Altitude:</span>{" "}
          {sensorData.altitude || "..."} m
        </div>
        <div className="bg-gray-800 p-1 rounded">
          <span className="text-cyan-200 font-semibold">Temperature:</span>{" "}
          {sensorData.temperature || "..."} °C
        </div>
        <div className="bg-gray-800 p-1 rounded">
          <span className="text-cyan-200 font-semibold">Pressure:</span>{" "}
          {sensorData.pressure || "..."} hPa
        </div>
        <div className="bg-gray-800 p-2 rounded">
          <span className="text-cyan-200 font-semibold">Humidity:</span>{" "}
          {sensorData.humidity || "..."} %
        </div>
        <div className="bg-gray-800 p-1 rounded">
          <span className="text-cyan-200 font-semibold">Battery:</span>{" "}
          {sensorData.battery || "-"} %
        </div>
        <div className="bg-gray-800 p-1 rounded">
          <span className="text-cyan-200 font-semibold">Compass:</span>{" "}
          {sensorData.compass || "..."}
        </div>
      </div>

      {/* 🧭 GPS Data */}
      <div className="space-y-1 space-x-1 rounded-lg mb-4 w-full max-w-md">
        <h2 className="font-semibold mb-2">📡 GPS Data</h2>

        <div className="bg-gray-800 p-1 rounded">
          Latitude: {sensorData.latitude || "..."}
        </div>
        <div className="bg-gray-800 p-1 rounded">
          Longitude: {sensorData.longitude || "..."}
        </div>
        <div className="bg-gray-800 p-1 rounded">
          Satellites: {sensorData.satellites || "..."}
        </div>
        <div className="bg-gray-800 p-1 rounded">
          ESP32 Time (UTC): {sensorData.esp32Time || "..."}
        </div>
        <div className="bg-gray-800 p-1 rounded">
          Dashboard Log Time: {sensorData.dashboardTime || "..."}
        </div>
      </div>

      {/* 📥 Log Download Button */}
      <button
        onClick={handleLogDownload}
        className="px-1 py-1 bg-blue-500 rounded hover:bg-blue-600"
      >
        Log Data (CSV)
      </button>
    </div>
  );
};

export default DashBoard02;
