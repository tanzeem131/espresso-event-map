export const icons = {
  link: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2">
    <path d="M15.197 3.355C16.87 1.675 19.448 1.539 20.954 3.05C22.46 4.562 22.324 7.15 20.651 8.829L18.227 11.263"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M10.046 14C8.54 12.488 8.676 9.901 10.349 8.221L12.5 6.062"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M13.954 10C15.46 11.512 15.324 14.099 13.651 15.779L11.227 18.212L8.803 20.645C7.13 22.325 4.552 22.461 3.046 20.95C1.54 19.438 1.676 16.85 3.349 15.171L5.773 12.737"
          stroke-linecap="round" stroke-linejoin="round"/>
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

  location: `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clip-rule="evenodd"/>
        </svg>
        `,
};

export const getEventStatus = (startAt) => {
  const now = new Date();
  const eventStart = new Date(startAt);

  return eventStart > now ? "upcoming" : "past";
};

export const formatReadableDate = (dateString) => {
  const date = new Date(dateString);

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatLocation = (geoInfo) => {
  if (!geoInfo) return "";
  const city = geoInfo.city || geoInfo.city_state || "";
  const country = geoInfo.country || "";

  if (city && country) return `${city}, ${country}`;
  return city || country || "";
};
