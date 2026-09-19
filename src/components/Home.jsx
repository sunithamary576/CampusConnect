import { useEffect, useState } from "react";

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const loadAnnouncements = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/announcements",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setAnnouncements(data.announcements);
      } else {
        setMessage(
          data.message || "Unable to load announcements."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const postAnnouncement = async () => {
    setMessage("");

    if (!title.trim() || !content.trim()) {
      setMessage("Please enter both title and content.");
      setMessageType("error");
      return;
    }

    setPosting(true);

    try {
      const response = await fetch(
        "http://localhost:5000/announcements",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title: title.trim(),
            content: content.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(
          data.message || "Unable to post announcement."
        );
        setMessageType("error");
        setPosting(false);
        return;
      }

      setMessage("Announcement posted successfully.");
      setMessageType("success");

      setTitle("");
      setContent("");

      await loadAnnouncements();
    } catch (error) {
      console.error(error);

      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }

    setPosting(false);
  };

  return (
    <section className="container py-4 pb-5 mb-5"> 
      {/* =========================
          WELCOME SECTION
      ========================== */}

      <div
        className="card border-0 shadow-sm mb-4 overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "white",
        }}
      >
        <div className="card-body p-4 p-md-5">

          <div className="d-flex align-items-center mb-3">
            <div
              className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                width: "55px",
                height: "55px",
                fontSize: "25px",
              }}
            >
              🎓
            </div>

            <div>
              <h2 className="fw-bold mb-1">
                Welcome to CampusConnect
              </h2>

              <p className="mb-0 opacity-75">
                Your campus, all in one place.
              </p>
            </div>
          </div>

          <p className="mb-0 mt-3">
            Stay connected with campus announcements,
            events, discussions, clubs, polls, and student
            activities.
          </p>

        </div>
      </div>


      {/* =========================
          QUICK FEATURES
      ========================== */}

      <div className="row g-3 mb-4">

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center h-100">
            <div className="card-body py-4">
              <div className="fs-2 mb-2">📢</div>
              <h6 className="fw-bold mb-1">
                Announcements
              </h6>
              <small className="text-muted">
                Campus updates
              </small>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center h-100">
            <div className="card-body py-4">
              <div className="fs-2 mb-2">💬</div>
              <h6 className="fw-bold mb-1">
                Forum
              </h6>
              <small className="text-muted">
                Discuss with students
              </small>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center h-100">
            <div className="card-body py-4">
              <div className="fs-2 mb-2">📅</div>
              <h6 className="fw-bold mb-1">
                Events
              </h6>
              <small className="text-muted">
                Campus activities
              </small>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm text-center h-100">
            <div className="card-body py-4">
              <div className="fs-2 mb-2">📊</div>
              <h6 className="fw-bold mb-1">
                Polls
              </h6>
              <small className="text-muted">
                Share your opinion
              </small>
            </div>
          </div>
        </div>

      </div>


      {/* =========================
          CREATE ANNOUNCEMENT
      ========================== */}

      <div className="card border-0 shadow-sm mb-4">

        <div className="card-body p-4">

          <div className="d-flex align-items-center mb-3">

            <div
              className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3"
              style={{
                width: "45px",
                height: "45px",
              }}
            >
              📢
            </div>

            <div>
              <h4 className="fw-bold mb-0">
                Post an Announcement
              </h4>

              <small className="text-muted">
                Share important information with the campus
              </small>
            </div>

          </div>


          <div className="mb-3">

            <label className="form-label fw-semibold">
              Title
            </label>

            <input
              type="text"
              className="form-control"
              placeholder="Enter announcement title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={posting}
            />

          </div>


          <div className="mb-3">

            <label className="form-label fw-semibold">
              Announcement
            </label>

            <textarea
              className="form-control"
              rows="4"
              placeholder="Write your announcement here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={posting}
            />

          </div>


          <button
            className="btn btn-primary px-4"
            onClick={postAnnouncement}
            disabled={posting}
          >
            {posting ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></span>
                Posting...
              </>
            ) : (
              "📢 Post Announcement"
            )}
          </button>


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
          ANNOUNCEMENTS
      ========================== */}

      <div className="mb-5">

        <div className="d-flex align-items-center mb-3">

          <div
            className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center me-3"
            style={{
              width: "45px",
              height: "45px",
            }}
          >
            📢
          </div>

          <div>
            <h4 className="fw-bold mb-0">
              Campus Announcements
            </h4>

            <small className="text-muted">
              Latest updates from your campus
            </small>
          </div>

        </div>


        {loading ? (

          <div className="card border-0 shadow-sm">

            <div className="card-body text-center py-5">

              <div
                className="spinner-border text-primary mb-3"
                role="status"
              ></div>

              <p className="text-muted mb-0">
                Loading announcements...
              </p>

            </div>

          </div>

        ) : announcements.length === 0 ? (

          <div className="card border-0 shadow-sm">

            <div className="card-body text-center py-5">

              <div className="fs-1 mb-3">
                📭
              </div>

              <h5 className="fw-bold">
                No announcements yet
              </h5>

              <p className="text-muted mb-0">
                Be the first to share an important campus update.
              </p>

            </div>

          </div>

        ) : (

          announcements.map((announcement) => (

            <div
              className="card border-0 shadow-sm mb-3"
              key={announcement.id}
            >

              <div className="card-body p-4">

                <div className="d-flex align-items-start">

                  <div
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                    style={{
                      width: "42px",
                      height: "42px",
                    }}
                  >
                    📢
                  </div>

                  <div className="flex-grow-1">

                    <h5 className="fw-bold mb-2">
                      {announcement.title}
                    </h5>

                    <p
                      className="mb-3"
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.6",
                      }}
                    >
                      {announcement.content}
                    </p>

                    <div className="text-muted small">
                      🕒 Posted on{" "}
                      {new Date(
                        announcement.created_at
                      ).toLocaleString()}
                    </div>

                  </div>

                </div>

              </div>

            </div>

          ))

        )}

      </div>

    </section>
  );
}