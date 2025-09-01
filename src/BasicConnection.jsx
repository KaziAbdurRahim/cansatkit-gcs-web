import React, { useState } from "react";
import axios from "axios";

function BasicConnection() {
  const [ip, setIp] = useState("");
  const [status, setStatus] = useState(null);

  const checkStatus = async () => {
    const res = await axios.get(`http://${ip}/status`);
    setStatus(res.data.led ? "ON" : "OFF");
  };

  const toggleLed = async (state) => {
    await axios.get(`http://${ip}/led/${state}`);
    checkStatus();
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>ESP32 Dashboard</h1>
      <input placeholder="ESP32 IP" onChange={(e) => setIp(e.target.value)} />
      <button onClick={checkStatus}>Check Status</button>
      <button onClick={() => toggleLed("on")}>Turn ON</button>
      <button onClick={() => toggleLed("off")}>Turn OFF</button>
      <p>LED is currently: {status}</p>
    </div>
  );
}

export default BasicConnection;
