import React from "react";

export default function Calendar({ events }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const calendar = [];

  // Empty cells before the first day
  for (let i = 0; i < firstDay; i++) {
    calendar.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendar.push(i);
  }

  // Get events for a particular day
  const getEventsForDay = (day) => {
    const dateString = `${year}-${String(
      month + 1
    ).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;

    return events.filter(
      (event) => event.event_date === dateString
    );
  };

  return (
    <div className="calendar-container">

      {/* Calendar Header */}

      <div className="text-center mb-3">
        <h4 className="fw-bold">
          {today.toLocaleString("default", {
            month: "long",
          })}{" "}
          {year}
        </h4>
      </div>

      {/* Weekday Names */}

      <div className="calendar-grid">

        {[
          "Sun",
          "Mon",
          "Tue",
          "Wed",
          "Thu",
          "Fri",
          "Sat",
        ].map((day) => (
          <div
            key={day}
            className="calendar-cell fw-bold text-center"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}

        {calendar.map((day, index) => (
          <div
            className="calendar-cell"
            key={index}
          >
            {day && (
              <>
                <div className="calendar-date">
                  {day}
                </div>

                {/* Events on this day */}

                {getEventsForDay(day).map(
                  (event) => (
                    <div
                      key={event.id}
                      className="calendar-event-text"
                    >
                      {event.title}
                    </div>
                  )
                )}
              </>
            )}
          </div>
        ))}

      </div>
    </div>
  );
}