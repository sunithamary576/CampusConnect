import { useState } from "react";

export default function ForgotPassword({ setActive }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const sendOtp = async () => {
    setMessage("");

    if (!email) {
      setMessage("Please enter your college email.");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/send-reset-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Unable to send OTP.");
        setMessageType("error");
        return;
      }

      setMessage("OTP sent successfully. Please check your email.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  const verifyOtp = async () => {
    setMessage("");

    if (!otp) {
      setMessage("Please enter the OTP.");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/verify-reset-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "OTP verification failed.");
        setMessageType("error");
        return;
      }

      setOtpVerified(true);
      setMessage("OTP verified successfully.");
      setMessageType("success");
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  const resetPassword = async () => {
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setMessage("Both password fields are required.");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            new_password: newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Password reset failed.");
        setMessageType("error");
        return;
      }

      setMessage("Password changed successfully.");
      setMessageType("success");

      setTimeout(() => {
        setActive("login");
      }, 1500);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to the server.");
      setMessageType("error");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div
        className="card shadow-lg border-0 p-4"
        style={{ width: "400px" }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold">Reset Password</h2>

          <p className="text-muted">
            Enter your college email to reset your password
          </p>
        </div>

        {/* Email */}
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
            disabled={otpVerified}
          />
        </div>

        {/* Send OTP */}
        {!otpVerified && (
          <>
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={sendOtp}
            >
              Send OTP
            </button>

            {/* OTP */}
            <div className="mt-4">
              <label className="form-label fw-semibold">
                Enter OTP
              </label>

              <input
                type="text"
                className="form-control"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />

              <button
                type="button"
                className="btn btn-success w-100 mt-3"
                onClick={verifyOtp}
              >
                Verify OTP
              </button>
            </div>
          </>
        )}

        {/* New Password */}
        {otpVerified && (
          <div>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                New Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">
                Confirm New Password
              </label>

              <input
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
              />
            </div>

            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={resetPassword}
            >
              Reset Password
            </button>
          </div>
        )}

        {/* Message */}
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

        {/* Back to Login */}
        <button
          type="button"
          className="btn btn-link mt-2"
          onClick={() => setActive("login")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}