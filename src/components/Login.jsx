import { useState } from "react";

export default function Login({ setActive }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const login = async () => {
  setMessage("");

  if (!email || !password) {
    setMessage("Email and password are required.");
    setMessageType("error");
    return;
  }

  setLoading(true);
  setMessage("Logging in...");
  setMessageType("loading");

  try {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Login successful!");
      setMessageType("success");

      setTimeout(() => {
        setActive("home");
      }, 800);
    } else {
      setMessage(data.message || "Login failed.");
      setMessageType("error");
    }
  } catch (error) {
    console.error(error);
    setMessage("Unable to connect to the server.");
    setMessageType("error");
  }

  setLoading(false);
};

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg border-0 p-4" style={{ width: "400px" }}>
        
        <div className="text-center mb-4">
          <h2 className="fw-bold">Campus Connect</h2>
          <p className="text-muted">Login with your college email</p>
        </div>

        <div className="mb-3">
  <label className="form-label fw-semibold">
    College Email
  </label>

  <input
    type="email"
    className="form-control"
    placeholder="example@cmrit.ac.in"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    disabled={loading}
  />
</div>

<div className="mb-3">
  <label className="form-label fw-semibold">
    Password
  </label>

  <input
    type="password"
    className="form-control"
    placeholder="Enter your password"
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    disabled={loading}
  />
</div>

<button
  className="btn btn-primary w-100"
  onClick={login}
  disabled={loading}
>
  {loading ? "Logging in..." : "Login"}
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
    </div>
  );
}