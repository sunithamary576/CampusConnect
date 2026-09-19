import React, { useEffect, useState } from "react";
import ClubCard from "./ClubCard";

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const loadClubs = async () => {
    try {
      const response = await fetch("http://localhost:5000/clubs", {
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setClubs(data.clubs);
      } else {
        setMessage(data.message || "Unable to load clubs.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  useEffect(() => {
    loadClubs();
  }, []);

  const addClub = async () => {
    setMessage("");

    if (!name.trim() || !description.trim()) {
      setMessage("Please fill all fields.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Adding club...");
    setMessageType("loading");

    try {
      const response = await fetch("http://localhost:5000/clubs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Club added successfully!");
        setMessageType("success");

        setName("");
        setDescription("");

        loadClubs();
      } else {
        setMessage(data.message || "Unable to add club.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }

    setLoading(false);
  };

  const deleteClub = async (id) => {
    try {
      const response = await fetch(
        `http://localhost:5000/clubs/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Club deleted successfully!");
        setMessageType("success");

        loadClubs();
      } else {
        setMessage(data.message || "Unable to delete club.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  return (
    <section className="container py-4">
      <h2 className="fw-bold mb-4">Clubs 🏛️</h2>

      <div className="card shadow-sm border-0 p-4 mb-4">
        <h4 className="fw-bold mb-3">Add Club</h4>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Club Name
          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Enter club name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Description
          </label>

          <textarea
            className="form-control"
            rows="3"
            placeholder="Enter club description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={addClub}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Club"}
        </button>

        {message && (
          <div
            className={`alert mt-3 mb-0 ${
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
      </div>

      <h4 className="fw-bold mb-3">Available Clubs</h4>

      {clubs.length === 0 ? (
        <div className="alert alert-info">
          No clubs available yet.
        </div>
      ) : (
        clubs.map((club) => (
          <ClubCard
            key={club.id}
            club={club}
            onDelete={deleteClub}
          />
        ))
      )}
    </section>
  );
}