import React from "react";
import Dashboard01 from "./Dashboard01";
import BasicConnection from "./BasicConnection";
import DashBoard02 from "./DashBoard02";

const Home = () => {
  return (
    <div>
      <DashBoard02></DashBoard02>
      {/* <BasicConnection></BasicConnection> */}
      <Dashboard01></Dashboard01>
    </div>
  );
};

export default Home;
