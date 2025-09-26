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
  const [userLocation, setUserLocation] = useState(null);
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingUpcoming, setIsLoadingUpcoming] = useState(true);
  const [isLoadingPast, setIsLoadingPast] = useState(true);
  const isLoading = isLoadingUpcoming || isLoadingPast;
  const [upcomingEventData, setUpcomingEventData] = useState();
  const [pastEventData, setPastEventData] = useState();
  const [resetMapTrigger, setResetMapTrigger] = useState(0);
  const [hostFilter, setHostFilter] = useState("all");
  const filteredEvents = getFilteredAndSortedEvents();
  const [isMapReady, setIsMapReady] = useState(false);

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

  const fetchDataPastEvent = async () => {
    try {
      setIsLoadingPast(true);

      const pastRes = await fetch(
        "/api/user/profile/events-hosting?pagination_cursor=evt-cqNTbzDjHZx4YJc&pagination_limit=40&period=past&user_api_id=usr-cAqsoa41hhkQxPs"
      );

      if (!pastRes.ok) {
        throw new Error(`HTTP error! status: ${pastRes.status}`);
      }

      const pastData = await pastRes.json();

      const pastEventsFromUpcoming = upcomingEventData?.events_past || [];
      const pastEventsFromHosting = pastData?.entries || [];

      const allPastEvents = [
        ...pastEventsFromUpcoming,
        ...pastEventsFromHosting,
      ];
      const uniquePastEvents = allPastEvents.reduce((unique, event) => {
        const existingEvent = unique.find((e) => e.api_id === event.api_id);
        if (!existingEvent) {
          unique.push(event);
        }
        return unique;
      }, []);

      const mergedPastData = {
        ...pastData,
        entries: uniquePastEvents,
      };

      setPastEventData(mergedPastData);
    } catch (error) {
      console.error("Error fetching past events:", error);
    } finally {
      setIsLoadingPast(false);
    }
  };

  useEffect(() => {
    fetchDataUpcomingEvent();
  }, []);

  useEffect(() => {
    if (upcomingEventData) {
      fetchDataPastEvent();
    }
  }, [upcomingEventData]);

  const getAllEvents = () => {
    const upcomingEvents =
      upcomingEventData?.events_hosting?.map((event) => ({
        id: event.api_id,
        title: event.event.name,
        location: formatLocation(event.event.geo_address_info),
        date: formatReadableDate(event.start_at),
        dateRaw: event.start_at,
        image: event.event?.cover_url,
        status: getEventStatus(event.start_at),
        attendees: event.guest_count || 0,
        hosts: event.hosts || [],
        primaryHost: event.hosts?.[0]?.name || "Unknown",
        region:
          event.event.geo_address_info?.country ||
          event.event.geo_address_info?.city_state ||
          "Unknown",
      })) || [];

    const pastEvents =
      pastEventData?.entries?.map((event) => ({
        id: event.api_id,
        title: event.event.name,
        location: formatLocation(event.event.geo_address_info),
        date: formatReadableDate(event.start_at),
        dateRaw: event.start_at,
        image: event.event?.cover_url,
        status: getEventStatus(event.start_at),
        attendees: event.guest_count || 0,
        hosts: event.hosts || [],
        primaryHost: event.hosts?.[0]?.name || "Unknown",
        region:
          event.event.geo_address_info?.country ||
          event.event.geo_address_info?.city_state ||
          "Unknown",
      })) || [];

    return [...upcomingEvents, ...pastEvents];
  };

  const getUniqueRegions = () => {
    const allEvents = getAllEvents();
    const regions = [...new Set(allEvents.map((event) => event.region))].filter(
      (region) => region !== "Unknown"
    );
    return regions.sort();
  };
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const getNearbyEvents = () => {
    if (!userLocation) return [];

    const allEvents = getAllEvents();
    const eventsWithDistance = [];

    allEvents.forEach((event) => {
      let coordinates = null;

      const upcomingEvent = upcomingEventData?.events_hosting?.find(
        (e) => e.api_id === event.id
      );
      if (upcomingEvent?.event?.coordinate) {
        coordinates = upcomingEvent.event.coordinate;
      } else {
        const pastEvent = pastEventData?.entries?.find(
          (e) => e.api_id === event.id
        );
        if (pastEvent?.event?.coordinate) {
          coordinates = pastEvent.event.coordinate;
        }
      }

      if (coordinates?.latitude && coordinates?.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          coordinates.latitude,
          coordinates.longitude
        );
        eventsWithDistance.push({ ...event, distance });
      }
    });

    return eventsWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  };

  const handleNearbyEvents = () => {
    if (showNearbyOnly) {
      setShowNearbyOnly(false);
      setUserLocation(null);
      return;
    }

    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setShowNearbyOnly(true);
        setIsGettingLocation(false);
      },
      (error) => {
        let errorMessage = "Unable to get your location. ";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Location access was denied.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
        }
        alert(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
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

  const handleEventCardClick = (event) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    let eventData = null;
    const upcomingEvent = upcomingEventData?.events_hosting?.find(
      (e) => e.api_id === event.id
    );
    if (upcomingEvent) {
      eventData = upcomingEvent;
    } else {
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
      }, 1000);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

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

    let eventsToShowOnMap = [];

    if (showNearbyOnly && userLocation) {
      const nearbyEvents = getNearbyEvents();
      eventsToShowOnMap = nearbyEvents;
    } else {
      const allEvents = getAllEvents();
      eventsToShowOnMap = allEvents.filter((event) => {
        const eventStatus = getEventStatus(event.dateRaw);
        const eventRegion = event.region;
        const eventHost = event.primaryHost;

        let statusMatch = filter === "all" || eventStatus === filter;
        let regionMatch =
          regionFilter === "all" || eventRegion === regionFilter;
        let hostMatch = hostFilter === "all" || eventHost === hostFilter;
        let searchMatch =
          !searchQuery.trim() ||
          event.title.toLowerCase().includes(searchQuery.toLowerCase().trim());

        return statusMatch && regionMatch && hostMatch && searchMatch;
      });
    }

    eventsToShowOnMap.forEach((event) => {
      let eventData = null;
      const upcomingEvent = upcomingEventData?.events_hosting?.find(
        (e) => e.api_id === event.id
      );
      if (upcomingEvent) {
        eventData = upcomingEvent;
      } else {
        const pastEvent = pastEventData?.entries?.find(
          (e) => e.api_id === event.id
        );
        if (pastEvent) {
          eventData = pastEvent;
        }
      }

      if (!eventData || !eventData.event.coordinate) return;

      const lat = eventData.event.coordinate?.latitude;
      const lng = eventData.event.coordinate?.longitude;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        return;
      }

      const eventStatus = getEventStatus(eventData.start_at);
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
            <div class="popup-title">${eventData.event.name}</div>
            <div class="popup-country">
            ${formatLocation(eventData.event.geo_address_info)}
            </div>
          </div>
          <div class="popup-close">${icons.close}</div>
        </div>
        <div class="popup-body">
          <div class="popup-date-section">
            <div class="popup-date-icon">${icons.calendar}</div>
            <div class="popup-date">${formatReadableDate(
              eventData.start_at
            )}</div>
          </div>
          <div class="popup-attendees">
            <div class="popup-attendees-icon">${icons.people}</div>
            <div class="popup-attendees-text">${
              eventData.guest_count
            } attendees</div>
          </div>
          
          <div class="popup-link">
            <div class="popup-link-icon">${icons.link}</div>
            <a href="https://luma.com/${
              eventData.event.url
            }" target="_blank" rel="noopener noreferrer" class="popup-link-text">
            Register
            </a>
          </div>
          
          <div class="popup-footer">
            <div class="popup-status-badge status-${eventStatus}">
              ${eventStatus === "past" ? "COMPLETED EVENT" : "UPCOMING EVENT"}
            </div>
            <button class="popup-zoom-btn">
              Go to Location
            </button>
          </div>
        </div>
      </div>
    `;

      L.marker([lat, lng], { icon })
        .bindPopup(popupContent, {
          className: "custom-popup",
          maxWidth: 350,
          closeButton: false,
          autoPan: true,
          autoPanPadding: [50, 50],
          keepInView: true,
          offset: [0, -10],
        })
        .on("popupopen", (e) => {
          const map = mapInstanceRef.current;
          if (map) {
            const mapContainer = map.getContainer();
            const mapRect = mapContainer.getBoundingClientRect();
            const headerHeight = 130;

            const adjustedCenterY =
              (mapRect.height - headerHeight) / 2 + headerHeight;
            const centerPoint = [mapRect.width / 2, adjustedCenterY];

            const targetLatLng = map.containerPointToLatLng(centerPoint);
            map.setView([lat, lng], map.getZoom(), {
              animate: true,
              duration: 0.3,
            });
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
                map.flyTo([lat, lng], 16, {
                  animate: true,
                  duration: 2,
                });
              }
            });
          }
        })
        .on("click", () => {
          if (map) {
            map.flyTo([lat, lng], 4, {
              animate: true,
              duration: 1.5,
            });
          }
        })
        .addTo(layerGroupRef.current);
    });
  }, [
    filter,
    regionFilter,
    hostFilter,
    isMapReady,
    searchQuery,
    upcomingEventData,
    pastEventData,
    resetMapTrigger,
    showNearbyOnly,
    userLocation,
  ]);

  useEffect(() => {
    if (resetMapTrigger && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([20, 0], 2, {
        animate: true,
        duration: 2,
      });
    }
  }, [resetMapTrigger]);

  return (
    <div className="map-view-container">
      <div className="map-header">
        <div className="map-header-logo">
          <img src="/Espresso-Logo.png" />
        </div>
        <div className="map-header-content">
          <div className="map-header-title">Espresso World Events</div>
          <div className="map-header-subtitle">Tracing our global journey</div>
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

          <div className="sidebar-filters">
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
            <button
              className={`nearby-events-btn ${showNearbyOnly ? "active" : ""}`}
              onClick={handleNearbyEvents}
              disabled={isGettingLocation}
            >
              {isGettingLocation
                ? "Getting Location..."
                : showNearbyOnly
                ? "Show All Events"
                : "Nearby Events"}
              <span
                dangerouslySetInnerHTML={{ __html: icons.locationNewIcon }}
              ></span>
            </button>
          </div>

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
