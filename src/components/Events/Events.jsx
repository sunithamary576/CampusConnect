import React, { useState, useEffect } from "react";
import Calendar from "./Calendar";

export default function Events() {
  const [events, setEvents] = useState([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

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
        setEvents(data.events);
      } else {
        setMessage(
          data.message || "Unable to load events."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // =========================
  // ADD EVENT
  // =========================

  const addEvent = async () => {
    setMessage("");

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
        setMessage("Event added successfully.");
        setMessageType("success");

        // Clear form
        setTitle("");
        setDescription("");
        setDate("");
        setTime("");
        setVenue("");

        // Reload events
        loadEvents();
      } else {
        setMessage(
          data.message || "Unable to add event."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    } finally {
      setPosting(false);
    }
  };

  return (
    <section className="section">

      {/* =========================
          PAGE TITLE
      ========================= */}

      <div className="text-center mb-4">
        <h3 className="fw-bold">
          Event Calendar 📅
        </h3>

        <p className="text-muted">
          Discover and share upcoming campus events.
        </p>
      </div>


      {/* =========================
          ADD EVENT
      ========================= */}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">

          <h4 className="fw-bold mb-3">
            Add New Event
          </h4>

          {/* TITLE */}

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


          {/* DESCRIPTION */}

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
                setDescription(e.target.value)
              }
              disabled={posting}
            />
          </div>


          {/* DATE */}

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


          {/* TIME */}

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


          {/* VENUE */}

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


          {/* ADD BUTTON */}

          <button
            className="btn btn-primary"
            onClick={addEvent}
            disabled={posting}
          >
            {posting ? "Adding Event..." : "Add Event"}
          </button>


          {/* MESSAGE */}

          {message && (
            <div
              className={`alert mt-3 mb-0 ${
                messageType === "success"
                  ? "alert-success"
                  : "alert-danger"
              }`}
            >
              {message}
            </div>
          )}

        </div>
      </div>


      {/* =========================
          CALENDAR
      ========================= */}

      <div className="mb-4">
        <Calendar events={events} />
      </div>


      {/* =========================
          EVENTS LIST
      ========================= */}

      <h4 className="fw-bold mb-3">
        Upcoming Events
      </h4>

      {loading ? (
        <div className="text-center py-4">

          <div
            className="spinner-border text-primary"
            role="status"
          ></div>

          <p className="mt-2">
            Loading events...
          </p>

        </div>
      ) : events.length === 0 ? (

        <div className="alert alert-info">
          No events available yet.
        </div>

      ) : (

        events.map((event) => (
          <div
            className="card shadow-sm border-0 mb-3"
            key={event.id}
          >

            <div className="card-body">

              <h5 className="fw-bold">
                {event.title}
              </h5>

              <p className="mb-3">
                {event.description}
              </p>

              <div className="text-muted">

                <div className="mb-1">
                  📅 <strong>Date:</strong>{" "}
                  {event.event_date}
                </div>

                <div className="mb-1">
                  🕐 <strong>Time:</strong>{" "}
                  {event.event_time}
                </div>

                <div>
                  📍 <strong>Venue:</strong>{" "}
                  {event.venue}
                </div>

              </div>

            </div>

          </div>
        ))

      )}

    </section>
  );
}