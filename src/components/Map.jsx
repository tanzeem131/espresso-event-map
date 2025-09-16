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
      location: "New York",
      country: "USA",
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
      location: "London",
      country: "UK",
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
      location: "San Francisco",
      country: "USA",
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
      location: "Berlin",
      country: "Germany",
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
      location: "Tokyo",
      country: "Japan",
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
      location: "Sydney",
      country: "Australia",
      date: "April 5, 2025",
      description:
        "Developer-focused sessions on implementing privacy features in dApps.",
      status: "upcoming",
      attendees: 200,
    },
  ];

  const icons = {
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="m12 2 0 2"></path>
      <path d="m12 20 0 2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="m2 12 2 0"></path>
      <path d="m20 12 2 0"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>`,

    calendar: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>`,

    people: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>`,

    star: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
    </svg>`,

    coffee: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z"></path>
      <line x1="6" y1="1" x2="6" y2="4"></line>
      <line x1="10" y1="1" x2="10" y2="4"></line>
      <line x1="14" y1="1" x2="14" y2="4"></line>
    </svg>`,

    close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>`,

    sunLarge: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="m12 2 0 2"></path>
      <path d="m12 20 0 2"></path>
      <path d="m4.93 4.93 1.41 1.41"></path>
      <path d="m17.66 17.66 1.41 1.41"></path>
      <path d="m2 12 2 0"></path>
      <path d="m20 12 2 0"></path>
      <path d="m6.34 17.66-1.41 1.41"></path>
      <path d="m19.07 4.93-1.41 1.41"></path>
    </svg>`,
  };

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
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy;',
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

    // Filter events and add markers to the layer group
    events
      .filter((event) => filter === "all" || event.status === filter)
      .forEach((event) => {
        const icon = L.divIcon({
          className: "custom-leaflet-icon",
          html: `
        <div class="marker-box ${event.status}">
          ${event.name}
        </div>
      `,
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });
        const popupContent = `
          <div class="popup-content">
            <div class="popup-header">
              <div class="popup-icon"><img src="/ES-symbol.png" /></div>
              <div class="popup-header-text">
                <div class="popup-title">${event.location}</div>
                <div class="popup-country">${event.country}</div>
              </div>
              <div class="popup-close">${icons.close}</div>
            </div>
            <div class="popup-body">
              <div class="popup-date-section">
                <div class="popup-date-icon">${icons.calendar}</div>
                <div class="popup-date">${event.date}</div>
              </div>
              <div class="popup-attendees">
                <div class="popup-attendees-icon">${icons.people}</div>
                <div class="popup-attendees-text">${
                  event.attendees
                } expected attendees</div>
              </div>
              <div class="popup-description">
                <div class="popup-description-icon">${icons.star}</div>
                <div class="popup-description-text">${event.description}</div>
              </div>
              <div class="popup-tagline">
                <div class="popup-tagline-icon">${icons.coffee}</div>
                <div class="popup-tagline-text">Espresso with skyline energy.</div>
              </div>
              <div class="popup-status-badge status-${event.status}">
                ${
                  event.status === "past" ? "COMPLETED EVENT" : "UPCOMING EVENT"
                }
              </div>
            </div>
          </div>
        `;
        L.marker([event.lat, event.lng], { icon })
          .bindPopup(popupContent, {
            className: "custom-popup",
            maxWidth: 300,
            closeButton: false,
            autoPan: true,
          })
          .on("popupopen", (e) => {
            const popupNode = e.popup.getElement();
            const closeBtn = popupNode.querySelector(".popup-close");
            if (closeBtn) {
              closeBtn.addEventListener("click", () => {
                map.closePopup();
              });
            }
          })
          .on("click", () => {
            if (map) {
              map.flyTo([event.lat, event.lng], 5, {
                animate: true,
                duration: 1.5,
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
            All Events
          </div>
          <div
            className={`map-legend-item ${filter === "past" ? "active" : ""}`}
            onClick={() => setFilter("past")}
          >
            Past Events
          </div>
          <div
            className={`map-legend-item ${
              filter === "upcoming" ? "active" : ""
            }`}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming Events
          </div>
        </div>
      </div>
    </div>
  );
};

export default Map;
