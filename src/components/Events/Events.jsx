import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";

export default function Events() {
  const [events, setEvents] = useState([]);

  // =========================
  // FORM STATES
  // =========================

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");

  // =========================
  // LOADING STATES
  // =========================

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  // =========================
  // MESSAGE STATES
  // =========================

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // =========================
  // LOAD EVENTS
  // =========================

  const loadEvents = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "http://localhost:5000/events",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setEvents(data.events || []);
      } else {
        setMessage(
          data.message || "Unable to load events."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error("Load events error:", error);

      setMessage(
        "Unable to connect to the server."
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD EVENTS WHEN PAGE OPENS
  // =========================

  useEffect(() => {
    loadEvents();
  }, []);

  // =========================
  // FORMAT DATE
  // =========================

  const formatDate = (eventDate) => {
    if (!eventDate) {
      return "";
    }

    return new Date(
      `${eventDate}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // =========================
  // FORMAT TIME
  // =========================

  const formatTime = (eventTime) => {
    if (!eventTime) {
      return "";
    }

    return new Date(
      `1970-01-01T${eventTime}`
    ).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // =========================
  // ADD EVENT
  // =========================

  const addEvent = async () => {
    setMessage("");

    // Validate form
    if (
      !title.trim() ||
      !description.trim() ||
      !date ||
      !time ||
      !venue.trim()
    ) {
      setMessage("Please fill all fields.");
      setMessageType("error");
      return;
    }

    try {
      setPosting(true);

      setMessage("Adding event...");
      setMessageType("loading");

      const response = await fetch(
        "http://localhost:5000/events",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
            event_date: date,
            event_time: time,
            venue: venue.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage(
          "Event added successfully."
        );
        setMessageType("success");

        // =========================
        // CLEAR FORM
        // =========================

        setTitle("");
        setDescription("");
        setDate("");
        setTime("");
        setVenue("");

        // =========================
        // RELOAD EVENTS
        // =========================

        await loadEvents();
      } else {
        setMessage(
          data.message ||
            "Unable to add event."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(
        "Add event error:",
        error
      );

      setMessage(
        "Unable to connect to the server."
      );
      setMessageType("error");
    } finally {
      setPosting(false);
    }
  };

  // =========================
  // PAGE UI
  // =========================

  return (
    <div className="container py-4 pb-5">

      {/* =========================
          PAGE TITLE
      ========================= */}

      <div className="text-center mb-4">

        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white mb-3"
          style={{
            width: "58px",
            height: "58px",
            fontSize: "26px",
          }}
        >
          📅
        </div>

        <h3 className="fw-bold mb-2">
          Event Calendar
        </h3>

        <p className="text-muted mb-0">
          Discover and share upcoming campus events.
        </p>

      </div>

      {/* =========================
          GLOBAL MESSAGE
      ========================= */}

      {message && (
        <div
          className={`alert ${
            messageType === "success"
              ? "alert-success"
              : messageType === "error"
              ? "alert-danger"
              : "alert-secondary"
          }`}
        >
          {message}
        </div>
      )}

      {/* =========================
          ADD EVENT
      ========================= */}

      <div className="card shadow-sm border-0 mb-4">

        <div className="card-body p-4">

          <div className="d-flex align-items-center mb-3">

            <div className="bg-primary-subtle text-primary rounded-3 p-2 me-3">
              ➕
            </div>

            <div>

              <h4 className="fw-bold mb-0">
                Add New Event
              </h4>

              <small className="text-muted">
                Share an upcoming campus event
              </small>

            </div>

          </div>

          {/* =========================
              EVENT TITLE
          ========================= */}

          <div className="mb-3">

            <label className="form-label fw-semibold">
              Event Title
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Enter event title"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              disabled={posting}
            />

          </div>

          {/* =========================
              DESCRIPTION
          ========================= */}

          <div className="mb-3">

            <label className="form-label fw-semibold">
              Description
            </label>

            <textarea
              className="form-control"
              rows="3"
              placeholder="Describe the event"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              disabled={posting}
            />

          </div>

          {/* =========================
              DATE
          ========================= */}

          <div className="mb-3">

            <label className="form-label fw-semibold">
              Date
            </label>

            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              disabled={posting}
            />

          </div>

          {/* =========================
              TIME
          ========================= */}

          <div className="mb-3">

            <label className="form-label fw-semibold">
              Time
            </label>

            <input
              type="time"
              className="form-control"
              value={time}
              onChange={(e) =>
                setTime(e.target.value)
              }
              disabled={posting}
            />

          </div>

          {/* =========================
              VENUE
          ========================= */}

          <div className="mb-3">

            <label className="form-label fw-semibold">
              Venue
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Enter venue"
              value={venue}
              onChange={(e) =>
                setVenue(e.target.value)
              }
              disabled={posting}
            />

          </div>

          {/* =========================
              ADD BUTTON
          ========================= */}

          <button
            className="btn btn-primary px-4"
            onClick={addEvent}
            disabled={posting}
          >
            {posting
              ? "Adding Event..."
              : "Add Event"}
          </button>

        </div>

      </div>

      {/* =========================
          CALENDAR
      ========================= */}

      <div className="card shadow-sm border-0 mb-5">

        <div className="card-body p-4">

          <h4 className="fw-bold mb-3">
            Campus Calendar
          </h4>

          <Calendar events={events} />

        </div>

      </div>

      {/* =========================
          EVENTS LIST
      ========================= */}

      <div className="d-flex justify-content-between align-items-center mb-3">

        <div>

          <h4 className="fw-bold mb-1">
            Upcoming Events
          </h4>

          <p className="text-muted small mb-0">
            Explore upcoming activities and programs.
          </p>

        </div>

        <span className="badge text-bg-light border">
          {events.length}{" "}
          {events.length === 1
            ? "event"
            : "events"}
        </span>

      </div>

      {/* =========================
          LOADING
      ========================= */}

      {loading ? (

        <div className="text-center py-5">

          <div
            className="spinner-border text-primary"
            role="status"
          >
            <span className="visually-hidden">
              Loading...
            </span>
          </div>

          <p className="mt-3 text-muted">
            Loading events...
          </p>

        </div>

      ) : events.length === 0 ? (

        /* =========================
           NO EVENTS
        ========================= */

        <div className="alert alert-info">

          <strong>
            No events available yet.
          </strong>

          <div className="small mt-1">
            Add the first campus event using
            the form above.
          </div>

        </div>

      ) : (

        /* =========================
           EVENTS
        ========================= */

        events.map((event) => (

          <div
            className="card shadow-sm border-0 mb-3"
            key={event.id}
          >

            <div className="card-body p-4">

              {/* EVENT TITLE */}

              <h5 className="fw-bold mb-2">
                {event.title}
              </h5>

              {/* EVENT DESCRIPTION */}

              <p
                className="mb-3"
                style={{
                  whiteSpace: "pre-wrap",
                }}
              >
                {event.description}
              </p>

              {/* EVENT INFORMATION */}

              <div className="text-muted">

                <div className="mb-2">

                  📅{" "}
                  <strong>
                    Date:
                  </strong>{" "}

                  {formatDate(
                    event.event_date
                  )}

                </div>

                <div className="mb-2">

                  🕐{" "}
                  <strong>
                    Time:
                  </strong>{" "}

                  {formatTime(
                    event.event_time
                  )}

                </div>

                <div>

                  📍{" "}
                  <strong>
                    Venue:
                  </strong>{" "}

                  {event.venue}

                </div>

              </div>

            </div>

          </div>

        ))

      )}

    </div>
  );
}