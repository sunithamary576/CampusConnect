import React, { useEffect, useState } from "react";
import MarketItem from "./MarketItem";

export default function Market() {
  const [market, setMarket] = useState([]);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [contact, setContact] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const [showPayment, setShowPayment] = useState(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  // Load marketplace items
  const loadMarket = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/market",
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMarket(data.items);
      } else {
        setMessage(
          data.message || "Unable to load marketplace."
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
    loadMarket();
  }, []);

  // Add marketplace item
  const addItem = async () => {
    setMessage("");

    if (!name.trim() || !price.trim() || !contact.trim()) {
      setMessage("Please fill all fields.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Adding item...");
    setMessageType("loading");

    try {
      const formData = new FormData();

      formData.append("name", name.trim());
      formData.append("price", price.trim());
      formData.append("contact", contact.trim());

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(
        "http://localhost:5000/market",
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Item added successfully!");
        setMessageType("success");

        setName("");
        setPrice("");
        setContact("");
        setImageFile(null);

        const fileInput =
          document.getElementById("itemImage");

        if (fileInput) {
          fileInput.value = "";
        }

        loadMarket();
      } else {
        setMessage(
          data.message || "Unable to add item."
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

  // Delete item
  const deleteItem = async (id) => {
    if (!window.confirm("Delete this item?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/market/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Item deleted successfully!");
        setMessageType("success");

        loadMarket();
      } else {
        setMessage(
          data.message || "Unable to delete item."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  // Edit item
  const editItem = async (id, newName, newPrice) => {
    try {
      const response = await fetch(
        `http://localhost:5000/market/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            name: newName,
            price: newPrice,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessage("Item updated successfully!");
        setMessageType("success");

        loadMarket();
      } else {
        setMessage(
          data.message || "Unable to update item."
        );
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  const openPayment = (item) => {
    setShowPayment(item);
  };

  const closePayment = () => {
    setShowPayment(null);
  };

  const simulatePayment = () => {
    setMessage("Payment simulated successfully!");
    setMessageType("success");
    closePayment();
  };

  return (
    <section className="container py-4">

      <h2 className="fw-bold mb-4">
        Marketplace 🛒
      </h2>

      {/* Add Item */}
      <div className="card shadow-sm border-0 p-4 mb-4">

        <h4 className="fw-bold mb-3">
          Add Item
        </h4>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Item Name
          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Enter item name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Price (₹)
          </label>

          <input
            type="number"
            className="form-control"
            placeholder="Enter price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Contact Email
          </label>

          <input
            type="email"
            className="form-control"
            placeholder="Enter contact email"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Item Image
          </label>

          <input
            id="itemImage"
            type="file"
            className="form-control"
            accept="image/png,image/jpeg,image/jpg"
            onChange={(e) =>
              setImageFile(e.target.files[0] || null)
            }
            disabled={loading}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={addItem}
          disabled={loading}
        >
          {loading ? "Adding..." : "Add Item"}
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

      {/* Items */}
      <h4 className="fw-bold mb-3">
        Available Items
      </h4>

      {market.length === 0 ? (
        <div className="alert alert-info">
          No marketplace items available yet.
        </div>
      ) : (
        market.map((item) => (
          <MarketItem
            key={item.id}
            item={item}
            onBuy={() => openPayment(item)}
            onEdit={editItem}
            onDelete={deleteItem}
          />
        ))
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div
          className="modal d-block"
          tabIndex="-1"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">
                  Payment for {showPayment.name}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={closePayment}
                ></button>
              </div>

              <div className="modal-body">

                <p>
                  <strong>Price:</strong>{" "}
                  ₹{showPayment.price}
                </p>

                <p>
                  <strong>Contact:</strong>{" "}
                  {showPayment.contact}
                </p>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter UPI ID"
                />

                <small className="text-muted d-block mt-2">
                  This is a simulated payment.
                </small>

              </div>

              <div className="modal-footer">

                <button
                  className="btn btn-secondary"
                  onClick={closePayment}
                >
                  Cancel
                </button>

                <button
                  className="btn btn-primary"
                  onClick={simulatePayment}
                >
                  💳 Pay Now
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

    </section>
  );
}