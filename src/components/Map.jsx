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
      name: "Espresso Brews WebX",
      lat: 35.6586,
      lng: 139.7486,
      location: "Tera Cafe Shien Zojo ji, Tokyo, Japan",
      // country: "Japan",
      date: "August 26, 2025 10:00 am",
      link: "https://www.espressosys.com/community",
      description: "A special WebX brew event at Tera Cafe.",
      status: "past",
      attendees: null,
    },
    {
      name: "Ethereum 10Y Anniversary",
      lat: 37.7825,
      lng: -122.4099,
      location: "Frontier Tower, 995 Market St, San Francisco, USA",
      // country: "USA",
      date: "July 30, 2025 4:00 pm",
      link: "https://www.espressosys.com/community",
      description:
        "Celebrating the 10-year anniversary of Ethereum in San Francisco.",
      status: "past",
      attendees: null,
    },
    {
      name: "Brewing the Base Layer | Espresso Happy Hour 🍸",
      lat: 37.5665,
      lng: 126.978,
      location: "Seoul, Korea",
      // country: "Korea",
      date: "September 20, 2025 4:00 pm",
      link: "https://luma.com/e0u6mnoc",
      description:
        "Espresso Systems invites you to come enjoy an Espresso martini while discovering what we’re brewing in the Ethereum L2 space.",
      status: "upcoming",
      attendees: 222,
    },
    {
      name: "Espresso & Partner Brews | KBW",
      lat: 37.5370666,
      lng: 126.9991267,
      location: "Seoul, Korea",
      // country: "Korea",
      date: "September 22, 2025 12:00 pm",
      link: "https://luma.com/h9uxi7c1",
      description: "Partner event at mtl cafe & bakery Hannam during KBW.",
      status: "upcoming",
      attendees: null,
    },
    {
      name: "That's That Me Espresso | Karaoke Night 🎤",
      lat: 36.5665,
      lng: 125.978,
      location: "Seoul, Korea",
      // country: "Korea",
      date: "September 25, 2025 8:00 pm",
      link: "https://luma.com/z4vmc849",
      description: "Espresso Karaoke Night event at KBW.",
      status: "upcoming",
      attendees: 612,
    },
  ];

  const icons = {
    link: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" 
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 13a5 5 0 0 1-7 0 5 5 0 0 1 0-7 5 5 0 0 1 7 0"/>
        <path d="M14 11a5 5 0 0 1 7 0 5 5 0 0 1 0 7 5 5 0 0 1-7 0"/>
        <line x1="8" y1="16" x2="16" y2="8"></line>
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

    close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
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
                Link
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
