import React, { useState } from "react";

export default function Calendar({ events }) {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  // Empty cells before the first day
  for (let i = 0; i < firstDay; i++) {
    calendar.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    calendar.push(i);
  }


  // Previous month
  const previousMonth = () => {
    setCurrentDate(
      new Date(year, month - 1, 1)
    );
  };


  // Next month
  const nextMonth = () => {
    setCurrentDate(
      new Date(year, month + 1, 1)
    );
  };


  // Get events for a particular day
  const getEventsForDay = (day) => {
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


  // Check today's date
  const isToday = (day) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };


  return (
    <div className="calendar-container">

      {/* Calendar Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">

        <button
          className="btn btn-outline-primary btn-sm"
          onClick={previousMonth}
        >
          ← Previous
        </button>

        <h4 className="fw-bold mb-0">
          {currentDate.toLocaleString(
            "default",
            {
              month: "long",
            }
          )}{" "}
          {year}
        </h4>

        <button
          className="btn btn-outline-primary btn-sm"
          onClick={nextMonth}
        >
          Next →
        </button>

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
            className={`calendar-cell ${
              day && isToday(day)
                ? "border border-primary"
                : ""
            }`}
            key={index}
          >

            {day && (
              <>
                <div
                  className={`calendar-date ${
                    isToday(day)
                      ? "fw-bold text-primary"
                      : ""
                  }`}
                >
                  {day}
                </div>


                {/* Events on this day */}
                {getEventsForDay(day).map(
                  (event) => (
                    <div
                      key={event.id}
                      className="calendar-event-text"
                    >
                      📅 {event.title}
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