import React, { useEffect, useState } from "react";
import PollCard from "./PollCard";

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  // Load polls
  const loadPolls = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/polls",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setPolls(data.polls);
      } else {
        setMessage(
          data.message || "Unable to load polls."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  // Create poll
  const addPoll = async () => {
    setMessage("");

    const optionList = options
      .split(",")
      .map((option) => option.trim())
      .filter(Boolean);

    if (!question.trim()) {
      setMessage("Please enter a poll question.");
      setMessageType("error");
      return;
    }

    if (optionList.length < 2) {
      setMessage(
        "Please enter at least two options."
      );
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Creating poll...");
    setMessageType("loading");

    try {
      const response = await fetch(
        "http://localhost:5000/polls",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            question: question.trim(),
            options: optionList,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Poll created successfully!");
        setMessageType("success");

        setQuestion("");
        setOptions("");

        loadPolls();
      } else {
        setMessage(
          data.message || "Unable to create poll."
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

  // Vote
  const vote = async (pollId, optionId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/polls/${pollId}/vote/${optionId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Vote recorded successfully!");
        setMessageType("success");

        loadPolls();
      } else {
        setMessage(
          data.message || "Unable to record vote."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  // Edit poll
  const editPoll = async (id, newQuestion) => {
    try {
      const response = await fetch(
        `http://localhost:5000/polls/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            question: newQuestion,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Poll updated successfully!");
        setMessageType("success");

        loadPolls();
      } else {
        setMessage(
          data.message || "Unable to update poll."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  // Delete poll
  const deletePoll = async (id) => {
    if (!window.confirm("Delete this poll?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/polls/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Poll deleted successfully!");
        setMessageType("success");

        loadPolls();
      } else {
        setMessage(
          data.message || "Unable to delete poll."
        );
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

      <h2 className="fw-bold mb-4">
        Polls & Surveys 📊
      </h2>

      {/* Create Poll */}
      <div className="card shadow-sm border-0 p-4 mb-4">

        <h4 className="fw-bold mb-3">
          Create Poll
        </h4>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Poll Question
          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Enter your question"
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Options
          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Example: Yes, No, Maybe"
            value={options}
            onChange={(e) =>
              setOptions(e.target.value)
            }
            disabled={loading}
          />

          <small className="text-muted">
            Separate options using commas.
          </small>
        </div>

        <button
          className="btn btn-primary"
          onClick={addPoll}
          disabled={loading}
        >
          {loading ? "Creating..." : "Add Poll"}
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

      {/* Poll List */}
      <h4 className="fw-bold mb-3">
        Available Polls
      </h4>

      {polls.length === 0 ? (
        <div className="alert alert-info">
          No polls available yet.
        </div>
      ) : (
        polls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            onVote={vote}
            onEdit={editPoll}
            onDelete={deletePoll}
          />
        ))
      )}

    </section>
  );
}