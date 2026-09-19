import React from "react";

export default function MarketItem({ item, onBuy, onEdit, onDelete }) {
  const editItem = () => {
    const newName = window.prompt(
      "Edit item name:",
      item.name
    );

    if (!newName || !newName.trim()) {
      return;
    }

    const newPrice = window.prompt(
      "Edit price:",
      item.price
    );

    if (!newPrice || !newPrice.trim()) {
      return;
    }

    onEdit(item.id, newName.trim(), newPrice.trim());
  };

  return (
    <div className="card shadow-sm border-0 mb-3">
      <div className="card-body">

        <h4 className="fw-bold">
          {item.name}
        </h4>

        <p className="text-muted">
          ₹{item.price} • {item.contact}
        </p>

        {item.image_path && (
          <img
            src={`http://localhost:5000/market/files/${item.image_path}`}
            className="market-img img-fluid rounded mb-3"
            alt={item.name}
            style={{
              maxWidth: "300px",
              maxHeight: "250px",
              objectFit: "contain",
            }}
          />
        )}

        <div className="d-flex gap-2 flex-wrap">

          <button
            className="btn btn-primary"
            onClick={onBuy}
          >
            💳 Buy Now
          </button>

          <button
            className="btn btn-warning"
            onClick={editItem}
          >
            ✏️ Edit
          </button>

          <button
            className="btn btn-danger"
            onClick={() => onDelete(item.id)}
          >
            🗑️ Delete
          </button>

        </div>

      </div>
    </div>
  );
}