import React, { useState } from "react";

export default function PollCard({
  poll,
  onVote,
  onEdit,
  onDelete,
}) {
  const [selectedOption, setSelectedOption] = useState("");
  const [voting, setVoting] = useState(false);

  const handleVote = async () => {
    if (!selectedOption) {
      alert("Please select an option first.");
      return;
    }

    setVoting(true);

    await onVote(
      poll.id,
      Number(selectedOption)
    );

    setVoting(false);
    setSelectedOption("");
  };

  const editPoll = () => {
    const newQuestion = window.prompt(
      "Edit poll question:",
      poll.question
    );

    if (!newQuestion || !newQuestion.trim()) {
      return;
    }

    onEdit(poll.id, newQuestion.trim());
  };

  return (
    <div className="card shadow-sm border-0 mb-3">
      <div className="card-body">

        <h4 className="fw-bold mb-3">
          {poll.question}
        </h4>

        <div className="mb-3">

          {poll.options.map((option) => (
            <div
              className="form-check mb-2"
              key={option.id}
            >
              <input
                className="form-check-input"
                type="radio"
                name={`poll-${poll.id}`}
                id={`poll-${poll.id}-option-${option.id}`}
                value={option.id}
                checked={
                  selectedOption ===
                  String(option.id)
                }
                onChange={(e) =>
                  setSelectedOption(e.target.value)
                }
                disabled={voting}
              />

              <label
                className="form-check-label"
                htmlFor={`poll-${poll.id}-option-${option.id}`}
              >
                {option.option_text}
              </label>
            </div>
          ))}

        </div>

        <button
          className="btn btn-primary mb-3"
          onClick={handleVote}
          disabled={voting}
        >
          {voting ? "Voting..." : "Vote"}
        </button>

        <div className="mb-3">
          <strong>Current Results:</strong>

          {poll.options.map((option) => (
            <div
              key={option.id}
              className="small text-muted"
            >
              {option.option_text}:{" "}
              {option.votes} vote
              {option.votes !== 1 ? "s" : ""}
            </div>
          ))}
        </div>

        <div className="d-flex gap-2">

          <button
            className="btn btn-warning btn-sm"
            onClick={editPoll}
          >
            ✏️ Edit
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => onDelete(poll.id)}
          >
            🗑️ Delete
          </button>

        </div>

      </div>
    </div>
  );
}