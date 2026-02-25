"use client";
import WorldMap from "@/components/ui/world-map";

export default function WorldMapDemo() {
  const newYork = {
    lat: 40.7128,
    lng: -74.006,
    label: "New York City",
    color: "#22c55e" as const,
  };

  return (
    <div className="w-full px-6 pb-12">
      <div className="container mx-auto max-w-6xl">
        <WorldMap
          dots={[
            {
              start: { lat: 64.2008, lng: -149.4937, label: "Alaska" }, // North America
              end: newYork, // Your location
            },
            {
              start: { lat: -33.4489, lng: -70.6693, label: "Santiago" }, // South America (Chile)
              end: newYork, // Your location
            },
            {
              start: { lat: 51.5074, lng: -0.1278, label: "London" }, // Europe
              end: newYork, // Your location
            },
            {
              start: { lat: -1.2921, lng: 36.8219, label: "Nairobi" }, // Africa
              end: newYork, // New York City (Your location)
            },
            {
              start: { lat: 35.6762, lng: 139.6503, label: "Tokyo" }, // Asia
              end: newYork, // New York City (Your location)
            },
            {
              start: { lat: -33.8688, lng: 151.2093, label: "Sydney" }, // Oceania
              end: newYork, // New York City (Your location)
            },
          ]}
        />
      </div>
    </div>
  );
}
