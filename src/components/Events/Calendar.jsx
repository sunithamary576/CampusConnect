import React, { useState } from "react";

export default function Calendar({ events = [] }) {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // =========================
  // CALENDAR INFORMATION
  // =========================

  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const calendar = [];

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    calendar.push(null);
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendar.push(i);
  }

  // =========================
  // PREVIOUS MONTH
  // =========================

  const previousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    );
  };

  // =========================
  // NEXT MONTH
  // =========================

  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    );
  };

  // =========================
  // GO TO TODAY
  // =========================

  const goToToday = () => {
    setCurrentDate(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );
  };

  // =========================
  // GET EVENTS FOR A DAY
  // =========================

  const getEventsForDay = (day) => {
    if (!day) {
      return [];
    }

    const dateString = `${year}-${String(
      month + 1
    ).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;

    return events.filter(
      (event) =>
        event.event_date === dateString
    );
  };

  // =========================
  // CHECK TODAY
  // =========================

  const isToday = (day) => {
    if (!day) {
      return false;
    }

    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  // =========================
  // MONTH NAME
  // =========================

  const monthName = currentDate.toLocaleString(
    "en-IN",
    {
      month: "long",
    }
  );

  // =========================
  // PAGE UI
  // =========================

  return (
    <div className="calendar-container">

      {/* =========================
          CALENDAR HEADER
      ========================= */}

      <div className="d-flex justify-content-between align-items-center mb-3 gap-2">

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={previousMonth}
        >
          ← Previous
        </button>

        <div className="text-center">

          <h4 className="fw-bold mb-1">
            {monthName} {year}
          </h4>

          <button
            type="button"
            className="btn btn-link btn-sm p-0"
            onClick={goToToday}
          >
            Today
          </button>

        </div>

        <button
          type="button"
          className="btn btn-outline-primary btn-sm"
          onClick={nextMonth}
        >
          Next →
        </button>

      </div>

      {/* =========================
          WEEKDAY NAMES
      ========================= */}

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
            className="calendar-cell calendar-weekday fw-bold text-center"
          >
            {day}
          </div>
        ))}

        {/* =========================
            CALENDAR DAYS
        ========================= */}

        {calendar.map((day, index) => {

          const dayEvents =
            day
              ? getEventsForDay(day)
              : [];

          return (
            <div
              key={index}
              className={`calendar-cell ${
                day && isToday(day)
                  ? "calendar-today"
                  : ""
              }`}
            >

              {day && (
                <>
                  {/* DAY NUMBER */}

                  <div
                    className={`calendar-date ${
                      isToday(day)
                        ? "fw-bold text-primary"
                        : ""
                    }`}
                  >
                    {day}
                  </div>

                  {/* =========================
                      EVENTS
                  ========================= */}

                  {dayEvents.length > 0 && (
                    <div className="calendar-events">

                      {dayEvents.map(
                        (event) => (
                          <div
                            key={event.id}
                            className="calendar-event-text"
                            title={`${event.title} - ${event.venue}`}
                          >
                            📅 {event.title}
                          </div>
                        )
                      )}

                    </div>
                  )}

                </>
              )}

            </div>
          );
        })}

      </div>

      {/* =========================
          EVENT INFORMATION
      ========================= */}

      <div className="mt-3">

        <small className="text-muted">
          📅 Events shown on their scheduled dates.
        </small>

      </div>

    </div>
  );
}