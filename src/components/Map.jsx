import { useEffect, useRef, useState } from "react";
import "./map.css";
import { icons } from "../utils/constants";
import { getEventStatus } from "../utils/constants";
import { formatReadableDate } from "../utils/constants";
import { formatLocation } from "../utils/constants";
import { EventListSkeleton } from "./EventListLoader";

const Map = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const leafletLoadedRef = useRef(false);

  const layerGroupRef = useRef(null);
  const [filter, setFilter] = useState("all");

  const [sortBy, setSortBy] = useState("date");
  const [regionFilter, setRegionFilter] = useState("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Add search state
  const [searchQuery, setSearchQuery] = useState("");

  // Add loading states
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [isLoadingPast, setIsLoadingPast] = useState(true);

  // Combined loading state - true if either data source is still loading
  const isLoading = isLoadingUpcoming || isLoadingPast;

  const [upcomingEventData, setUpcomingEventData] = useState();
  const [pastEventData, setPastEventData] = useState();
  const [resetMapTrigger, setResetMapTrigger] = useState(0);

  const [hostFilter, setHostFilter] = useState("all"); // Add this state

  // Get unique hosts for filter dropdown
  const getUniqueHosts = () => {
    const allEvents = getAllEvents();
    const hosts = [
      ...new Set(allEvents.map((event) => event.primaryHost)),
    ].filter((host) => host !== "Unknown");
    return hosts.sort();
  };

  const resetMapView = () => {
    setResetMapTrigger((prev) => prev + 1);
  };

  const fetchDataUpcomingEvent = async () => {
    try {
      setIsLoadingUpcoming(true);
      const res = await fetch(
        "/api/user/profile/events?username=usr-cAqsoa41hhkQxPs"
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const resdata = await res.json();
      setUpcomingEventData(resdata);
    } catch (error) {
      console.error("Error fetching upcoming events:", error);
    } finally {
      setIsLoadingUpcoming(false);
    }
  };

  useEffect(() => {
    fetchDataUpcomingEvent();
  }, []);

  const fetchDataPastEvent = async () => {
    try {
      setIsLoadingPast(true);
      const res = await fetch(
        "/api/user/profile/events-hosting?pagination_cursor=evt-cqNTbzDjHZx4YJc&pagination_limit=40&period=past&user_api_id=usr-cAqsoa41hhkQxPs"
      );
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const resdata = await res.json();
      setPastEventData(resdata);
    } catch (error) {
      console.error("Error fetching past events:", error);
    } finally {
      setIsLoadingPast(false);
    }
  };

  useEffect(() => {
    fetchDataPastEvent();
  }, []);

  // Combine both data sources for sidebar
  // Fixed getAllEvents function
  const getAllEvents = () => {
    const upcomingEvents =
      upcomingEventData?.events_hosting?.map((event) => ({
        id: event.api_id,
        title: event.event.name,
        location: formatLocation(event.event.geo_address_info),
        date: formatReadableDate(event.start_at),
        dateRaw: event.start_at, // Added
        image: event.event?.cover_url,
        status: getEventStatus(event.start_at),
        attendees: event.guest_count || 0, // Added
        hosts: event.hosts || [],
        primaryHost: event.hosts?.[0]?.name || "Unknown",
        region:
          event.event.geo_address_info?.country ||
          event.event.geo_address_info?.city_state ||
          "Unknown", // Added
      })) || [];

    const pastEvents =
      pastEventData?.entries?.map((event) => ({
        id: event.api_id,
        title: event.event.name,
        location: formatLocation(event.event.geo_address_info),
        date: formatReadableDate(event.start_at),
        dateRaw: event.start_at, // Added
        image: event.event?.cover_url,
        status: getEventStatus(event.start_at),
        attendees: event.guest_count || 0, // Added
        hosts: event.hosts || [],
        primaryHost: event.hosts?.[0]?.name || "Unknown",
        region:
          event.event.geo_address_info?.country ||
          event.event.geo_address_info?.city_state ||
          "Unknown", // Added
      })) || [];

    return [...upcomingEvents, ...pastEvents];
  };

  // Get unique regions for filter dropdown
  const getUniqueRegions = () => {
    const allEvents = getAllEvents();
    const regions = [...new Set(allEvents.map((event) => event.region))].filter(
      (region) => region !== "Unknown"
    );
    return regions.sort();
  };

  // Apply filters and sorting
  const getFilteredAndSortedEvents = () => {
    let events = getAllEvents();

    // Apply search filter first (case-insensitive)
    if (searchQuery.trim()) {
      events = events.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
    }

    // Apply status filter
    if (filter !== "all") {
      events = events.filter((event) => event.status === filter);
    }

    // Apply region filter
    if (regionFilter !== "all") {
      events = events.filter((event) => event.region === regionFilter);
    }

    // Apply host filter
    if (hostFilter !== "all") {
      events = events.filter((event) => event.primaryHost === hostFilter);
    }

    // Fixed sorting with correct property names
    switch (sortBy) {
      case "date":
        events = events.sort(
          (a, b) => new Date(b.dateRaw) - new Date(a.dateRaw)
        );
        break;
      case "attendees":
        events = events.sort((a, b) => b.attendees - a.attendees);
        break;
      case "name":
        events = events.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return events;
  };

  const filteredEvents = getFilteredAndSortedEvents();

  // const filteredEvents = getAllEvents().filter(
  //   (event) => filter === "all" || event.status === filter
  // );

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

  const handleEventCardClick = (event) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Find the event data to get coordinates
    let eventData = null;

    // Check in upcoming events
    const upcomingEvent = upcomingEventData?.events_hosting?.find(
      (e) => e.api_id === event.id
    );
    if (upcomingEvent) {
      eventData = upcomingEvent;
    } else {
      // Check in past events
      const pastEvent = pastEventData?.entries?.find(
        (e) => e.api_id === event.id
      );
      if (pastEvent) {
        eventData = pastEvent;
      }
    }

    if (eventData && eventData.event.coordinate) {
      const { latitude, longitude } = eventData.event.coordinate;

      // Fly to the location and open popup
      map.flyTo([latitude, longitude], 6, {
        animate: true,
        duration: 2,
      });

      // Find and open the marker popup after a short delay
      setTimeout(() => {
        layerGroupRef.current.eachLayer((layer) => {
          if (
            layer.getLatLng &&
            layer.getLatLng().lat === latitude &&
            layer.getLatLng().lng === longitude
          ) {
            layer.openPopup();
          }
        });
      }, 1000); // Delay to allow fly animation to complete
    }
  };

  // Clear search function
  const clearSearch = () => {
    setSearchQuery("");
  };

  // Clear all filters and search
  const clearAllFiltersAndSearch = () => {
    setSortBy("date");
    setRegionFilter("all");
    setHostFilter("all");
    setSearchQuery("");
    setIsFilterDropdownOpen(false);
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
          minZoom: 2, // Prevents zooming out too much
          maxZoom: 18, // Limits maximum zoom
          zoomControl: false,
          scrollWheelZoom: true,
          worldCopyJump: false, // Prevents world wrapping
          maxBounds: [
            [-90, -180],
            [90, 180],
          ], // Keeps map within world bounds
          maxBoundsViscosity: 1.0, // Makes bounds "sticky"
        });

        mapInstanceRef.current = map;

        L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

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

    upcomingEventData?.events_hosting
      .filter((event) => {
        const eventStatus = getEventStatus(event.start_at);
        const eventRegion =
          event.event.geo_address_info?.country ||
          event.event.geo_address_info?.city_state ||
          "Unknown";

        let statusMatch = filter === "all" || eventStatus === filter;
        let regionMatch =
          regionFilter === "all" || eventRegion === regionFilter;

        return statusMatch && regionMatch; // Added region filtering
      })
      .forEach((event) => {
        const lat = event.event.coordinate?.latitude;
        const lng = event.event.coordinate?.longitude;

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return;
        }

        const eventStatus = getEventStatus(event.start_at);
        const icon = L.divIcon({
          className: "custom-leaflet-icon",
          html: `
            <div class="marker-box ${eventStatus}">
            ${icons.location}   
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
                <div class="popup-title">${event.event.name}</div>
                <div class="popup-country">
                ${formatLocation(event.event.geo_address_info)}
                </div>
              </div>
              <div class="popup-close">${icons.close}</div>
            </div>
            <div class="popup-body">
              <div class="popup-date-section">
                <div class="popup-date-icon">${icons.calendar}</div>
                <div class="popup-date">${formatReadableDate(
                  event.start_at
                )}</div>
              </div>
              <div class="popup-attendees">
                <div class="popup-attendees-icon">${icons.people}</div>
                <div class="popup-attendees-text">${
                  event.guest_count
                } attendees</div>
              </div>
              
              <div class="popup-link">
                <div class="popup-link-icon">${icons.link}</div>
                <a href="https://luma.com/${
                  event.event.url
                }" target="_blank" rel="noopener noreferrer" class="popup-link-text">
                Register
                </a>
              </div>
              
              <div class="popup-footer">
                <div class="popup-status-badge status-${eventStatus}">
                  ${
                    eventStatus === "past"
                      ? "COMPLETED EVENT"
                      : "UPCOMING EVENT"
                  }
                </div>
                <button class="popup-zoom-btn">
                  Go to Location
                </button>
              </div>
            </div>
          </div>
        `;
        L.marker(
          [event.event.coordinate.latitude, event.event.coordinate.longitude],
          { icon }
        )
          .bindPopup(popupContent, {
            className: "custom-popup",
            maxWidth: 350,
            closeButton: false,
            autoPan: true, // Enable auto-panning
            autoPanPadding: [50, 50], // Padding from screen edges
            keepInView: true, // Keep popup in view
            offset: [0, -10],
          })
          .on("popupopen", (e) => {
            // Center the map on the marker when popup opens
            const map = mapInstanceRef.current;
            if (map) {
              const mapContainer = map.getContainer();
              const mapRect = mapContainer.getBoundingClientRect();
              const headerHeight = 130; // Adjust based on your header height

              // Calculate center point accounting for header
              const adjustedCenterY =
                (mapRect.height - headerHeight) / 2 + headerHeight;
              const centerPoint = [mapRect.width / 2, adjustedCenterY];

              // Convert to lat/lng and pan to that position
              const targetLatLng = map.containerPointToLatLng(centerPoint);
              map.setView(
                [
                  event.event.coordinate.latitude,
                  event.event.coordinate.longitude,
                ],
                map.getZoom(),
                {
                  animate: true,
                  duration: 0.3,
                }
              );
            }

            const popupNode = e.popup.getElement();
            const closeBtn = popupNode.querySelector(".popup-close");
            if (closeBtn) {
              closeBtn.addEventListener("click", () => {
                map.closePopup();
              });
            }

            const zoomBtn = popupNode.querySelector(".popup-zoom-btn");
            if (zoomBtn) {
              zoomBtn.addEventListener("click", () => {
                if (map) {
                  map.flyTo(
                    [
                      event.event.coordinate.latitude,
                      event.event.coordinate.longitude,
                    ],
                    16,
                    {
                      animate: true,
                      duration: 2,
                    }
                  );
                }
              });
            }
          })
          .on("click", () => {
            if (map) {
              map.flyTo(
                [
                  event.event.coordinate.latitude,
                  event.event.coordinate.longitude,
                ],
                4,
                {
                  animate: true,
                  duration: 1.5,
                }
              );
            }
          })
          .addTo(layerGroupRef.current);
      });

    pastEventData?.entries
      .filter((event) => {
        const eventStatus = getEventStatus(event.start_at);
        const eventRegion =
          event.event.geo_address_info?.country ||
          event.event.geo_address_info?.city_state ||
          "Unknown";

        let statusMatch = filter === "all" || eventStatus === filter;
        let regionMatch =
          regionFilter === "all" || eventRegion === regionFilter;

        return statusMatch && regionMatch; // Added region filtering
      })
      .forEach((event) => {
        const lat = event.event.coordinate?.latitude;
        const lng = event.event.coordinate?.longitude;

        if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
          return;
        }
        const eventStatus = getEventStatus(event.start_at);
        const icon = L.divIcon({
          className: "custom-leaflet-icon",
          html: `
            <div class="marker-box ${eventStatus}">
            ${icons.location}   
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
                <div class="popup-title">${event.event.name}</div>
                <div class="popup-country">
                ${formatLocation(event.event.geo_address_info)}
                </div>
              </div>
              <div class="popup-close">${icons.close}</div>
            </div>
            <div class="popup-body">
              <div class="popup-date-section">
                <div class="popup-date-icon">${icons.calendar}</div>
                <div class="popup-date">${formatReadableDate(
                  event.start_at
                )}</div>
              </div>
              <div class="popup-attendees">
                <div class="popup-attendees-icon">${icons.people}</div>
                <div class="popup-attendees-text">${
                  event.guest_count
                } attendees</div>
              </div>
              
              <div class="popup-link">
                <div class="popup-link-icon">${icons.link}</div>
                <a href="https://luma.com/${
                  event.event.url
                }" target="_blank" rel="noopener noreferrer" class="popup-link-text">
                Register
                </a>
              </div>
              
              <div class="popup-footer">
                <div class="popup-status-badge status-${eventStatus}">
                  ${
                    eventStatus === "past"
                      ? "COMPLETED EVENT"
                      : "UPCOMING EVENT"
                  }
                </div>
                <button class="popup-zoom-btn">
                  Go to Location
                </button>
              </div>
            </div>
          </div>
        `;
        L.marker(
          [event.event.coordinate?.latitude, event.event.coordinate?.longitude],
          { icon }
        )
          .bindPopup(popupContent, {
            className: "custom-popup",
            maxWidth: 350,
            closeButton: false,
            autoPan: true, // Enable auto-panning
            autoPanPadding: [50, 50], // Padding from screen edges
            keepInView: true, // Keep popup in view
            offset: [0, -10],
          })
          .on("popupopen", (e) => {
            // Center the map on the marker when popup opens
            const map = mapInstanceRef.current;
            if (map) {
              const mapContainer = map.getContainer();
              const mapRect = mapContainer.getBoundingClientRect();
              const headerHeight = 130; // Adjust based on your header height

              // Calculate center point accounting for header
              const adjustedCenterY =
                (mapRect.height - headerHeight) / 2 + headerHeight;
              const centerPoint = [mapRect.width / 2, adjustedCenterY];

              // Convert to lat/lng and pan to that position
              const targetLatLng = map.containerPointToLatLng(centerPoint);
              map.setView(
                [
                  event.event.coordinate?.latitude,
                  event.event.coordinate?.longitude,
                ],
                map.getZoom(),
                {
                  animate: true,
                  duration: 0.3,
                }
              );
            }

            const popupNode = e.popup.getElement();
            const closeBtn = popupNode.querySelector(".popup-close");
            if (closeBtn) {
              closeBtn.addEventListener("click", () => {
                map.closePopup();
              });
            }

            const zoomBtn = popupNode.querySelector(".popup-zoom-btn");
            if (zoomBtn) {
              zoomBtn.addEventListener("click", () => {
                if (map) {
                  map.flyTo(
                    [
                      event.event.coordinate?.latitude,
                      event.event.coordinate?.longitude,
                    ],
                    16,
                    {
                      animate: true,
                      duration: 2,
                    }
                  );
                }
              });
            }
          })
          .on("click", () => {
            if (map) {
              map.flyTo(
                [
                  event.event.coordinate?.latitude,
                  event.event.coordinate?.longitude,
                ],
                4,
                {
                  animate: true,
                  duration: 1.5,
                }
              );
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
  }, [
    filter,
    regionFilter,
    hostFilter,
    isMapReady,
    searchQuery,
    upcomingEventData,
    pastEventData,
    resetMapTrigger,
  ]);

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

      <div className="map-layout">
        <div className="map-container">
          <div ref={mapRef} className="map-area" />

          <div className="map-legend-filter-container">
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
              {`Past Events (${pastEventData?.entries?.length || 0})`}
            </div>
            <div
              className={`map-legend-item ${
                filter === "upcoming" ? "active" : ""
              }`}
              onClick={() => setFilter("upcoming")}
            >
              {`Upcoming Events (${
                upcomingEventData?.events_hosting?.length || 0
              })`}
            </div>
            <button className="map-reset-btn" onClick={resetMapView}>
              Reset Map View
            </button>
          </div>
        </div>

        <div className="sidebar">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <div className="logo-circle">
                <img src="/ES-symbol.png" />
              </div>
            </div>
            <div className="sidebar-title-section">
              <h3 className="sidebar-brand">Espresso Systems</h3>
              <h2 className="sidebar-title">
                {filter === "all"
                  ? "All Events"
                  : filter === "past"
                  ? "Past Events"
                  : "Upcoming Events"}
              </h2>
            </div>
          </div>

          {/* New Filter Controls */}
          <div className="sidebar-filters">
            {/* Search Input */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search events by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    className="search-clear-btn"
                    onClick={clearSearch}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <div className="filter-dropdown-container">
              <button
                className="filter-dropdown-btn"
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              >
                <span>Sort & Filter</span>
                <span
                  className={`dropdown-arrow ${
                    isFilterDropdownOpen ? "open" : ""
                  }`}
                >
                  ▼
                </span>
              </button>

              {isFilterDropdownOpen && (
                <div className="filter-dropdown-menu">
                  {/* Sort Options */}
                  <div className="filter-section">
                    <h4 className="filter-section-title">Sort By</h4>
                    <div className="filter-options">
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="sortBy"
                          value="date"
                          checked={sortBy === "date"}
                          onChange={(e) => setSortBy(e.target.value)}
                        />
                        <span>Date</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="sortBy"
                          value="attendees"
                          checked={sortBy === "attendees"}
                          onChange={(e) => setSortBy(e.target.value)}
                        />
                        <span>Attendees</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="sortBy"
                          value="name"
                          checked={sortBy === "name"}
                          onChange={(e) => setSortBy(e.target.value)}
                        />
                        <span>Name</span>
                      </label>
                    </div>
                  </div>

                  {/* Region Filter */}
                  <div className="filter-section">
                    <h4 className="filter-section-title">Region</h4>
                    <div className="filter-options">
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="regionFilter"
                          value="all"
                          checked={regionFilter === "all"}
                          onChange={(e) => setRegionFilter(e.target.value)}
                        />
                        <span>All Regions</span>
                      </label>
                      {getUniqueRegions().map((region) => (
                        <label key={region} className="filter-option">
                          <input
                            type="radio"
                            name="regionFilter"
                            value={region}
                            checked={regionFilter === region}
                            onChange={(e) => setRegionFilter(e.target.value)}
                          />
                          <span>{region}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Host Filter - NEW SECTION */}
                  <div className="filter-section">
                    <h4 className="filter-section-title">Hosted By</h4>
                    <div className="filter-options">
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="hostFilter"
                          value="all"
                          checked={hostFilter === "all"}
                          onChange={(e) => setHostFilter(e.target.value)}
                        />
                        <span>All Hosts</span>
                      </label>
                      {getUniqueHosts().map((host) => (
                        <label key={host} className="filter-option">
                          <input
                            type="radio"
                            name="hostFilter"
                            value={host}
                            checked={hostFilter === host}
                            onChange={(e) => setHostFilter(e.target.value)}
                          />
                          <span>{host}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="filter-section">
                    <button
                      className="clear-filters-btn"
                      onClick={clearAllFiltersAndSearch}
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Updated events list with skeleton loader */}
          {isLoading ? (
            <EventListSkeleton count={8} />
          ) : filteredEvents.length > 0 ? (
            <div className="events-list">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="event-card"
                  onClick={() => handleEventCardClick(event)}
                >
                  <div className="event-image">
                    <img src={event.image} alt={event.title} />
                  </div>
                  <div className="event-content">
                    <h4 className="event-title">{event.title}</h4>
                    <div className="event-organizer">
                      <div
                        className="organizer-avatars"
                        dangerouslySetInnerHTML={{ __html: icons.location }}
                      ></div>
                      <span className="organizer-text">{event.location}</span>
                    </div>
                    <p className="event-date">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="events-list">
              <div className="no-events-message">
                <p>
                  {searchQuery
                    ? `No events found matching "${searchQuery}"`
                    : "No events found matching your criteria."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
