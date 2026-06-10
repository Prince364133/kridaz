import { useEffect } from "react";
import { onLCP, onINP, onCLS } from "web-vitals";
import axiosInstance from "../infrastructure/axios.js";

function sendToBackend(metric) {
  const body = JSON.stringify({
    metricName: metric.name,
    value: metric.value,
    id: metric.id,
    delta: metric.delta
  });

  // Using sendBeacon for better reliability on page unload, fallback to axios
  if (navigator.sendBeacon) {
    // Note: Assuming /api/metrics exists and handles POST request
    navigator.sendBeacon("/api/metrics/vitals", body);
  } else {
    axiosInstance.post("/api/metrics/vitals", body, {
      headers: { "Content-Type": "application/json" }
    }).catch(console.error);
  }
}

export function ObservabilityProvider({ children }) {
  useEffect(() => {
    onCLS(sendToBackend);
    onINP(sendToBackend);
    onLCP(sendToBackend);
  }, []);

  return <>{children}</>;
}

