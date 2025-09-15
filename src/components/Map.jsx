import { useEffect, useRef, useState } from "react";
import "./map.css";

const Map = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletLoadedRef = useRef(false);

  const layerGroupRef = useRef(null);

  // State to manage the current event filter
  const [filter, setFilter] = useState("all");

  const [isMapReady, setIsMapReady] = useState(false);

  const events = [
    {
      name: "Espresso Summit 2024",
      lat: 40.7128,
      lng: -74.006,
      location: "New York, USA",
      date: "March 15, 2024",
      description:
        "Annual blockchain conference featuring the latest in zero-knowledge proofs and decentralized systems.",
      status: "past",
      attendees: 500,
    },
    {
      name: "DeFi Privacy Workshop",
      lat: 51.5074,
      lng: -0.1278,
      location: "London, UK",
      date: "June 20, 2024",
      description:
        "Technical workshop on privacy-preserving DeFi protocols using Espresso's infrastructure.",
      status: "past",
      attendees: 150,
    },
    {
      name: "Web3 Privacy Conference",
      lat: 37.7749,
      lng: -122.4194,
      location: "San Francisco, USA",
      date: "November 8, 2024",
      description:
        "Exploring the future of privacy in Web3 applications and blockchain networks.",
      status: "upcoming",
      attendees: 300,
    },
    {
      name: "European Blockchain Week",
      lat: 52.52,
      lng: 13.405,
      location: "Berlin, Germany",
      date: "December 12, 2024",
      description:
        "Join us at Europe's premier blockchain event to discuss scalable privacy solutions.",
      status: "upcoming",
      attendees: 800,
    },
    {
      name: "Asian Crypto Summit",
      lat: 35.6762,
      lng: 139.6503,
      location: "Tokyo, Japan",
      date: "February 18, 2025",
      description:
        "Bringing zero-knowledge technology to the Asian market with local partners.",
      status: "upcoming",
      attendees: 400,
    },
    {
      name: "DevCon Privacy Track",
      lat: -33.8688,
      lng: 151.2093,
      location: "Sydney, Australia",
      date: "April 5, 2025",
      description:
        "Developer-focused sessions on implementing privacy features in dApps.",
      status: "upcoming",
      attendees: 200,
    },
  ];

  const loadLeaflet = () => {
    return new Promise((resolve, reject) => {
      if (window.L && leafletLoadedRef.current) {
        resolve(window.L);
        return;
      }
      const cssLink = document.createElement("link");
      cssLink.rel = "stylesheet";
      cssLink.href =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
      document.head.appendChild(cssLink);
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = () => {
        leafletLoadedRef.current = true;
        resolve(window.L);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  // Effect for initializing the map (runs only once)
  useEffect(() => {
    let mounted = true;
    const initializeMap = async () => {
      try {
        const L = await loadLeaflet();
        if (!mounted || !mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
          center: [20, 0],
          zoom: 2,
          zoomControl: true,
          scrollWheelZoom: true,
        });
        mapInstanceRef.current = map;
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19,
          }
        ).addTo(map);

        // Initialize the layer group and add it to the map
        layerGroupRef.current = L.layerGroup().addTo(map);
        setIsMapReady(true);
      } catch (error) {
        console.error("Failed to load Leaflet:", error);
      }
    };
    initializeMap();
    return () => {
      mounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Effect for updating markers when the filter changes
  useEffect(() => {
    if (!isMapReady || !layerGroupRef.current || !window.L) return;

    // Clear previous markers
    layerGroupRef.current.clearLayers();

    const L = window.L;
    const map = mapInstanceRef.current;

    // Define icons
    const pastEventIcon = L.divIcon({
      className: "custom-leaflet-icon",
      html: `<div class="marker-pin past"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });
    const upcomingEventIcon = L.divIcon({
      className: "custom-leaflet-icon",
      html: `<div class="marker-pin upcoming"></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    // Filter events and add markers to the layer group
    events
      .filter((event) => filter === "all" || event.status === filter)
      .forEach((event) => {
        const icon =
          event.status === "past" ? pastEventIcon : upcomingEventIcon;
        const popupContent = `
            <div class="popup-content">
              <div class="popup-title">${event.name}</div>
              <div class="popup-date">📅 ${event.date}</div>
              <div class="popup-description">
                📍 ${event.location}<br>
                👥 ${event.attendees} attendees<br><br>
                ${event.description}
              </div>
              <div class="popup-status status-${event.status}">
                ${event.status === "past" ? "Completed" : "Upcoming"}
              </div>
            </div>
          `;
        L.marker([event.lat, event.lng], { icon })
          .bindPopup(popupContent, {
            className: "custom-popup",
            maxWidth: 300,
            closeButton: true,
          })
          .on("click", () => {
            if (map) {
              map.flyTo([event.lat, event.lng], 13, {
                animate: true,
                duration: 2,
              });
            }
          })
          .addTo(layerGroupRef.current);
      });

    if (map) {
      map.flyTo([20, 0], 2, {
        animate: true,
        duration: 2,
      });
    }
  }, [filter, isMapReady]);

  return (
    <div className="map-view-container">
      <div className="map-header">
        <div className="map-header-logo">
          <img src="/Espresso-Logo.png" />
        </div>
        <div className="map-header-content">
          <h1 className="map-header-title">Espresso World Events</h1>
          <p className="map-header-subtitle">
            Discover where we've been and where we're heading next
          </p>
        </div>
      </div>

      <div className="map-container">
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

        <div className="map-legend">
          <h3 className="map-legend-title">Filter Events</h3>
          {/* New "All Events" filter */}
          <div
            className={`map-legend-item ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            <div className="legend-marker all"></div>
            All Events
          </div>
          <div
            className={`map-legend-item ${filter === "past" ? "active" : ""}`}
            onClick={() => setFilter("past")}
          >
            <div className="legend-marker past"></div>
            Past Events
          </div>
          <div
            className={`map-legend-item ${
              filter === "upcoming" ? "active" : ""
            }`}
            onClick={() => setFilter("upcoming")}
          >
            <div className="legend-marker upcoming"></div>
            Upcoming Events
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
