import React from "react";

export default function ClubCard({ club, onDelete }) {

  const deleteClub = async () => {

    if (!window.confirm("Delete this club?")) {
      return;
    }

    if (onDelete) {
      onDelete(club.id);
    }
  };


  return (
    <div className="card shadow-sm border-0 mb-3">

      <div className="card-body">

        <h4 className="fw-bold">
          {club.name}
        </h4>

        <p className="text-muted mb-3">
          {club.description}
        </p>


        {club.created_at && (
          <div className="text-muted small mb-3">
            Created:{" "}
            {new Date(
              club.created_at
            ).toLocaleString()}
          </div>
        )}


        <button
          className="btn btn-danger btn-sm"
          onClick={deleteClub}
        >
          🗑️ Delete
        </button>

      </div>

    </div>
  );
}