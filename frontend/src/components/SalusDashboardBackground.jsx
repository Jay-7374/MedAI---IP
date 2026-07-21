import React from "react";
import "./SalusDashboardBackground.css";

const SalusDashboardBackground = () => {
  return (
    <div className="salus-dashboard-background" aria-hidden="true">
      <video
        className="salus-dashboard-background__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      >
        <source src="/videos/salus-dashboard-bg.mp4" type="video/mp4" />
      </video>
      <div className="salus-dashboard-background__overlay" />
    </div>
  );
};

export default SalusDashboardBackground;
