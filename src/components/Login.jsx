import { useState } from "react";

export default function Login({ setActive }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const sendOTP = async () => {
    const collegeEmail = email.trim().toLowerCase();

    setMessage("");

    if (!collegeEmail.endsWith("@cmrit.ac.in")) {
      setMessage("Please use your CMRIT college email.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Sending OTP...");
    setMessageType("loading");

    try {
      const response = await fetch("http://localhost:5000/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: collegeEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setMessage("OTP sent successfully to your college email.");
        setMessageType("success");
      } else {
        setMessage(data.message || "Unable to send OTP.");
        setMessageType("error");
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }

    setLoading(false);
  };

  const verifyOTP = async () => {
    setMessage("");

    if (!otp || otp.length !== 6) {
      setMessage("Please enter the 6-digit OTP.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("Verifying OTP...");
    setMessageType("loading");

    try {
      const response = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Login successful!");
        setMessageType("success");

        localStorage.setItem(
          "campusUser",
          email.trim().toLowerCase().split("@")[0]
        );

        setTimeout(() => {
          setActive("home");
        }, 800);
      } else {
        setMessage(data.message || "Incorrect OTP.");
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

        {!otpSent ? (
          <>
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

            <button
              className="btn btn-primary w-100"
              onClick={sendOTP}
              disabled={loading}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <div className="alert alert-info">
              OTP sent to <strong>{email}</strong>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Enter OTP
              </label>

              <input
                type="text"
                className="form-control text-center"
                placeholder="Enter 6-digit OTP"
                maxLength="6"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, ""))
                }
                disabled={loading}
              />
            </div>

            <button
              className="btn btn-success w-100"
              onClick={verifyOTP}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

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