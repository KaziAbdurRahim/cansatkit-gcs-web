import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

// -----------------------------------------------------------------------------
// 📁 Utility Function: Export logged data as CSV
// -----------------------------------------------------------------------------
const exportToCSV = (data, filename = "cansat_log.csv") => {
  if (!data || data.length === 0) return;

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

  const csvRows = data.map((row) =>
    headers.map((header) => row[header] || "").join(",")
  );

  const csvContent = headers.join(",") + "\n" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// -----------------------------------------------------------------------------
// 📊 React Component: DashBoard03
// -----------------------------------------------------------------------------
const DashBoard03 = () => {
  // 🔹 State Variables
  const [ip, setIp] = useState(""); // ESP32 IP address
  const [connected, setConnected] = useState(false); // Connection status
  const [sensorData, setSensorData] = useState({}); // Latest ESP32 data
  const [logData, setLogData] = useState([]); // Historical log
  const [intervalId, setIntervalId] = useState(null); // Polling interval
  const [isLogging, setIsLogging] = useState(false); // Logging toggle

  const loggingRef = useRef(false); // 🔄 Keeps logging state updated inside setInterval

  // ---------------------------------------------------------------------------
  // 🔌 Connect or Disconnect from ESP32
  // ---------------------------------------------------------------------------
  const toggleConnection = async () => {
    if (connected) {
      clearInterval(intervalId);
      setConnected(false);
      setSensorData({});
      return;
    }

    try {
      const res = await axios.get(`http://${ip}/connect`);
      if (res.data.connected) {
        setConnected(true);
        startPolling();
      } else {
        alert("ESP32 did not confirm connection.");
      }
    } catch (err) {
      alert("Connection failed. Check IP and network.");
    }
  };

  // ---------------------------------------------------------------------------
  // ⏱️ Poll ESP32 every second for sensor data
  // ---------------------------------------------------------------------------
  const startPolling = () => {
    const id = setInterval(async () => {
      try {
        const res = await axios.get(`http://${ip}/data`);
        const timestampedData = {
          ...res.data,
          esp32Time: res.data.time,
          dashboardTime: new Date().toISOString(),
        };

        setSensorData(timestampedData); // Always show latest

        if (loggingRef.current) {
          setLogData((prev) => [...prev, timestampedData]); // Only log if active
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000);

    setIntervalId(id);
  };

  // ---------------------------------------------------------------------------
  // 🧹 Cleanup on component unmount
  // ---------------------------------------------------------------------------
  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  // ---------------------------------------------------------------------------
  // 🟢 Start Logging
  // ---------------------------------------------------------------------------
  const handleStartLogging = () => {
    setIsLogging(true);
    loggingRef.current = true;
  };

  // 🔄 Reset everything
  const handleReset = () => {
    setLogData([]);
    setSensorData({});
    setIsLogging(false);
    loggingRef.current = false;
  };

  // 📡 Send Calibration Command
  const handleCalibrate = async () => {
    try {
      const command = encodeURIComponent("CMD,111,CALIBRATE");
      await axios.get(`http://${ip}/cmd?value=${command}`);
      alert("Calibration command sent.");
    } catch (err) {
      console.error("Calibration error:", err);
      alert("Failed to send calibration command.");
    }
  };

  // 💾 Download logged data
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
      <h1 className="text-2xl font-bold mb-4 text-center">
        BRACU Diganta CanSat Learning Kit
      </h1>

      {/* 🌐 IP Input + Connect Button */}
      <div className="flex gap-1 mb-2 text-sm text-center items-center">
        <input
          type="text"
          placeholder="EnterESP32IP: 192.168.0.123"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="rounded text-white border-2 bg-gray-700 py-0.5"
        />
        <button
          onClick={toggleConnection}
          className={`px-1 py-1 rounded font-semibold  ${
            connected ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {connected ? "Disconnect" : "Connect"}
        </button>
        {/* <div>
          <p className="text-sm">
            Status:{" "}
            <span className={connected ? "text-green-400" : "text-red-400"}>
              {connected ? "✅ " : "❌ "}
            </span>
          </p>
        </div> */}
      </div>

      {/* 🔘 Command Panel */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleStartLogging}
          className="px-1 font-semibold text-sm text-white py-1 rounded bg-green-300 text-black"
        >
          Start Logging
        </button>
        <button
          onClick={handleReset}
          className="px-1 font-semibold text-sm text-white py-1 rounded bg-blue-500"
        >
          Reset
        </button>
        <button
          onClick={handleCalibrate}
          className="px-1 font-semibold text-sm text-white py-1 rounded bg-yellow-600"
        >
          Calibrate
        </button>
      </div>

      {/* 🧾 Logging Status */}
      {isLogging && (
        <p className="text-green-400 mb-2 text-sm">🟢 Logging active</p>
      )}

      {/* 📊 Sensor Data with Units */}
      <div className="grid grid-cols-2 gap-1 mb-2">
        {[
          { key: "altitude", label: "Altitude", unit: "m" },
          { key: "temperature", label: "Temperature", unit: "°C" },
          { key: "pressure", label: "Pressure", unit: "hPa" },
          { key: "humidity", label: "Humidity", unit: "%" },
          { key: "battery", label: "Battery", unit: "%" },
          { key: "compass", label: "Compass", unit: "" },
        ].map(({ key, label, unit }) => (
          <div key={key} className="bg-gray-800 p-1 rounded text-sm">
            <span className="text-cyan-200 font-semibold ">{label}:</span>{" "}
            <span className="text-white">
              {sensorData[key] !== undefined
                ? `${sensorData[key]} ${unit}`
                : "..."}
            </span>
          </div>
        ))}
      </div>

      {/* 🧭 GPS Data with Styled Header */}
      <div className="space-y-1 w-full max-w-md mb-2">
        <h2 className="text-lg font-bold text-blue-300 mb-2">
          📡 GPS & Time Data
        </h2>
        {[
          { key: "latitude", label: "Latitude" },
          { key: "longitude", label: "Longitude" },
          { key: "satellites", label: "Satellites" },
          { key: "esp32Time", label: "ESP32 Time (UTC)" },
          { key: "dashboardTime", label: "Dashboard Log Time" },
        ].map(({ key, label }) => (
          <div key={key} className="bg-gray-800 p-1 text-sm rounded">
            <span className="text-cyan-300 font-semibold">{label}:</span>{" "}
            <span className="text-white">{sensorData[key] || "..."}</span>
          </div>
        ))}
      </div>

      {/* 📊 Sensor Data */}
      {/* <div className="grid grid-cols-2 gap-1 mb-2">
        {[
          "altitude",
          "temperature",
          "pressure",
          "humidity",
          "battery",
          "compass",
        ].map((key) => (
          <div key={key} className="bg-gray-800 p-1 rounded">
            <span className="text-cyan-200 font-semibold">
              {key.charAt(0).toUpperCase() + key.slice(1)}:
            </span>
            {sensorData[key] || "..."}{" "}
          </div>
        ))}
      </div> */}

      {/* 🧭 GPS Data */}
      {/* <div className="space-y-1 w-full max-w-md mb-1">
        {[
          "latitude",
          "longitude",
          "satellites",
          "esp32Time",
          "dashboardTime",
        ].map((key) => (
          <div key={key} className="bg-gray-800 p-1 rounded">
            {key.replace(/([A-Z])/g, " $1")}: {sensorData[key] || "..."}
          </div>
        ))}
      </div> */}

      {/* 📥 Download Button */}
      <button
        onClick={handleLogDownload}
        className="px-1 py-1 bg-blue-500 rounded hover:bg-blue-600 text-sm"
      >
        Download Log (CSV)
      </button>
    </div>
  );
};

export default DashBoard03;
