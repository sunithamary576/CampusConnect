import { useEffect, useState } from "react";

export default function Home() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(true);

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
        setMessage(data.message || "Unable to load announcements.");
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
        setMessage(data.message || "Unable to post announcement.");
        setMessageType("error");
        return;
      }

      setMessage("Announcement posted successfully.");
      setMessageType("success");

      setTitle("");
      setContent("");

      loadAnnouncements();
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  return (
    <section className="container py-4">

      {/* Welcome */}
      <div className="card shadow-sm border-0 p-4 mb-4">
        <h3 className="fw-bold">
          Welcome to CampusConnect 🎓
        </h3>

        <p className="text-muted mb-0">
          Stay updated with campus events, discussions, and clubs!
        </p>
      </div>

      {/* Create Announcement */}
      <div className="card shadow-sm border-0 p-4 mb-4">
        <h4 className="fw-bold mb-3">
          📢 Post an Announcement
        </h4>

        <input
          type="text"
          className="form-control mb-3"
          placeholder="Announcement title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="form-control mb-3"
          rows="4"
          placeholder="Write your announcement..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          className="btn btn-primary"
          onClick={postAnnouncement}
        >
          Post Announcement
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

      {/* Announcements */}
      <div>
        <h4 className="fw-bold mb-3">
          📢 Campus Announcements
        </h4>

        {loading ? (
          <div className="alert alert-secondary">
            Loading announcements...
          </div>
        ) : announcements.length === 0 ? (
          <div className="alert alert-secondary">
            No announcements yet.
          </div>
        ) : (
          announcements.map((announcement) => (
            <div
              className="card shadow-sm border-0 mb-3"
              key={announcement.id}
            >
              <div className="card-body">

                <h5 className="fw-bold">
                  {announcement.title}
                </h5>

                <p className="mb-2">
                  {announcement.content}
                </p>

                <small className="text-muted">
                  Posted on{" "}
                  {new Date(
                    announcement.created_at
                  ).toLocaleString()}
                </small>

              </div>
            </div>
          ))
        )}
      </div>

    </section>
  );
}