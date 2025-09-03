import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";

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
// 📊 React Component: DashBoard03 (BLE Version)
// -----------------------------------------------------------------------------
const DashBoard04 = () => {
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState({});
  const [logData, setLogData] = useState([]);
  const [isLogging, setIsLogging] = useState(false);
  const loggingRef = useRef(false);

  const serviceUUID = "12345678-1234-1234-1234-123456789abc";
  const characteristicUUID = "abcd1234-abcd-1234-abcd-123456789abc";

  // ---------------------------------------------------------------------------
  // 🔌 Connect to ESP32 via BLE
  // ---------------------------------------------------------------------------
  const connectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "CanSatBLE" }],
        optionalServices: [serviceUUID],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(serviceUUID);
      const characteristic = await service.getCharacteristic(
        characteristicUUID
      );

      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        const value = new TextDecoder().decode(event.target.value);
        try {
          const parsed = JSON.parse(value);
          const timestampedData = {
            ...parsed,
            esp32Time: new Date().toISOString(),
            dashboardTime: new Date().toISOString(),
          };

          setSensorData(timestampedData);
          if (loggingRef.current) {
            setLogData((prev) => [...prev, timestampedData]);
          }
        } catch (err) {
          console.error("Failed to parse BLE data:", err);
        }
      });

      setConnected(true);
    } catch (err) {
      console.error("Bluetooth connection failed:", err);
      alert("Bluetooth connection failed.");
    }
  };

  const handleStartLogging = () => {
    setIsLogging(true);
    loggingRef.current = true;
  };

  const handleReset = () => {
    setLogData([]);
    setSensorData({});
    setIsLogging(false);
    loggingRef.current = false;
  };

  const handleLogDownload = () => {
    if (logData.length === 0) {
      alert("No data to save.");
      return;
    }
    exportToCSV(logData);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-6">
      <Helmet>
        <title>CanSat Ground Control System | BRACU Diganta</title>
        <meta
          name="description"
          content="Monitor and control CanSat telemetry data in real-time using ESP32 and React."
        />
        <meta
          name="keywords"
          content="CanSat, Cansat GCS, ESP32, telemetry, ground control, BRACU Diganta, IoT, satellite "
        />
      </Helmet>

      <h1 className="text-2xl font-bold mb-4 text-center">
        BRACU Diganta CanSat Learning Kit
      </h1>

      {/* 🔗 Bluetooth Connect Button */}
      <button
        onClick={connectBluetooth}
        className={`px-2 py-1 rounded font-semibold mb-4 ${
          connected ? "bg-red-500" : "bg-green-500"
        }`}
      >
        {connected ? "Disconnect" : "Connect via Bluetooth"}
      </button>

      {/* 🔘 Command Panel */}
      <div className="flex gap-2 mb-4  items-center">
        <button
          onClick={handleStartLogging}
          className="px-2 font-semibold text-sm text-white py-1 rounded bg-green-300 text-black"
        >
          Start Logging
        </button>
        <button
          onClick={handleReset}
          className="px-2 font-semibold text-sm text-white py-1 rounded bg-blue-500"
        >
          Reset
        </button>
      </div>

      {/* 🧾 Logging Status */}
      {isLogging && (
        <p className="text-green-400 mb-2 text-sm">🟢 Logging active</p>
      )}

      {/* 📊 Sensor Data */}
      <div className="grid grid-cols-2 gap-1 mb-2  space-y-1 w-full max-w-md">
        {[
          { key: "altitude", label: "Altitude", unit: "m" },
          { key: "temperature", label: "Temperature", unit: "°C" },
          { key: "pressure", label: "Pressure", unit: "hPa" },
          { key: "humidity", label: "Humidity", unit: "%" },
          { key: "battery", label: "Battery", unit: "%" },
          { key: "compass", label: "Compass", unit: "" },
        ].map(({ key, label, unit }) => (
          <div key={key} className="bg-gray-800 p-1 rounded text-sm">
            <span className="text-cyan-200 font-semibold">{label}:</span>{" "}
            <span className="text-white">
              {sensorData[key] !== undefined
                ? `${sensorData[key]} ${unit}`
                : "..."}
            </span>
          </div>
        ))}
      </div>

      {/* 🧭 GPS & Time Data */}
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

      {/* 📥 Download Button */}
      <button
        onClick={handleLogDownload}
        className="px-2 py-1 bg-blue-500 rounded hover:bg-blue-600 text-sm"
      >
        Download Log (CSV)
      </button>
    </div>
  );
};

export default DashBoard04;
