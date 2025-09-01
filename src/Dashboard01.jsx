import React, { useState, useEffect } from "react";
import axios from "axios";

const Dashboard01 = () => {
  const [ip, setIp] = useState("");
  const [connected, setConnected] = useState(false);
  const [data, setData] = useState("");
  const [intervalId, setIntervalId] = useState(null);

  //  Connect to ESP32
  const connectToESP32 = async () => {
    try {
      const res = await axios.get(`http://${ip}/connect`);
      if (res.data.connected) {
        setConnected(true);
        startPolling();
      }
    } catch (err) {
      setConnected(false);
      alert("Connection failed. Check IP and network.");
    }
  };

  //  Poll data every second
  const startPolling = () => {
    const id = setInterval(async () => {
      try {
        const res = await axios.get(`http://${ip}/data`);
        setData(res.data);
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 1000);
    setIntervalId(id);
  };

  //  Cleanup on unmount
  useEffect(() => {
    return () => clearInterval(intervalId);
  }, [intervalId]);

  //  Send ON command
  const sendOnCommand = async () => {
    try {
      await axios.get(`http://${ip}/cmd?value=ON`);
    } catch (err) {
      alert("Failed to send command");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
          ESP32 Dashboard
        </h1>

        <input
          type="text"
          placeholder="Enter ESP32 IP (e.g. 192.168.0.123)"
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={connectToESP32}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition mb-4"
        >
          Connect
        </button>

        <div className="text-center mb-4">
          <p className="text-sm text-gray-700">
            Connection Status:{" "}
            <span className={connected ? "text-green-600" : "text-red-600"}>
              {connected ? "✅ Connected" : "❌ Not Connected"}
            </span>
          </p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
          <p className="text-sm text-gray-800">
            Received Data:{" "}
            <span className="font-semibold text-blue-700">{data}</span>
          </p>
        </div>

        <button
          onClick={sendOnCommand}
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
        >
          Send ON Command
        </button>
      </div>
    </div>
  );
};

export default Dashboard01;
