// EventListSkeleton component
import "./eventLoader.css";

export const EventListSkeleton = ({ count = 6 }) => {
  const EventSkeleton = () => (
    <div className="event-card skeleton-card">
      <div className="event-image">
        <div className="skeleton skeleton-image"></div>
      </div>
      <div className="event-content">
        <div className="skeleton skeleton-title"></div>
        <div className="event-organizer">
          <div className="skeleton skeleton-icon"></div>
          <div className="skeleton skeleton-location"></div>
        </div>
        <div className="skeleton skeleton-date"></div>
      </div>
    </div>
  );

  return (
    <div className="events-list">
      {Array.from({ length: count }, (_, index) => (
        <EventSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
};
