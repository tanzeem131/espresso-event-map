import { useEffect, useRef, useState } from "react";
import "./map.css";
import { icons } from "../utils/constants";
import { events } from "../utils/constants";

const Map = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletLoadedRef = useRef(false);

  const layerGroupRef = useRef(null);
  const [filter, setFilter] = useState("all");

  const [isMapReady, setIsMapReady] = useState(false);

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

  useEffect(() => {
    let mounted = true;
    const initializeMap = async () => {
      try {
        const L = await loadLeaflet();
        if (!mounted || !mapRef.current || mapInstanceRef.current) return;

        const map = L.map(mapRef.current, {
          center: [20, 0],
          zoom: 2,
          zoomControl: false,
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

  useEffect(() => {
    if (!isMapReady || !layerGroupRef.current || !window.L) return;

    layerGroupRef.current.clearLayers();

    const L = window.L;
    const map = mapInstanceRef.current;

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
                <div class="popup-title">${event.name}</div>
                <div class="popup-country">${event.location}</div>
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
              <div class="popup-link">
                <div class="popup-link-icon">${icons.link}</div>
                <a href="${
                  event.link
                }" target="_blank" rel="noopener noreferrer" class="popup-link-text">
                Register
                </a>
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
          <div className="map-header-title">Espresso World Events</div>
          <div className="map-header-subtitle">
            Discover where we've been and where we're heading next
          </div>
        </div>
        <div className="map-header-globe">
          <img src="/Openess.png" />
        </div>
      </div>

      <div className="map-container">
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />

        <div className="map-legend">
          <h3 className="map-legend-title">Filter Events</h3>
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
