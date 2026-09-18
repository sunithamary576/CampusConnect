import { useState } from "react";

export default function Register({ setActive }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [usn, setUsn] = useState("");
    const [department, setDepartment] = useState("");
    const [year, setYear] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const register = async() => {
        setMessage("");
        setMessageType("");
    if (
        !name ||
        !email ||
        !usn ||
        !department ||
        !year ||
        !password ||
        !confirmPassword
    ) {
        setMessage("Please fill in all fields.");
        setMessageType("error");
        return;
    }

    if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        setMessageType("error");
        return;
    }

    if (!email.toLowerCase().endsWith("@cmrit.ac.in")) {
        setMessage("Please use your CMRIT college email.");
        setMessageType("error");
        return;
    }

    const response = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            name: name,
            email: email.trim().toLowerCase(),
            usn: usn.trim(),
            department: department.trim(),
            year: Number(year),
            password: password,
        }),
    });

    const data = await response.json();

    if (!response.ok) {
    setMessage(data.message || "Registration failed.");
    setMessageType("error");
    return;
    }

    setMessage(data.message);
    setMessageType("success");

    setTimeout(() => {
    setActive("login");
    }, 1500);

};

const verifyOtp = async () => {
  if (!otp) {
    setMessage("Please enter the OTP.");
    return;
  }

  const response = await fetch("http://localhost:5000/verify-registration-otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    setMessage(data.message || "OTP verification failed.");
    setMessageType("error");
    return;
    }

    setMessage(data.message);
    setMessageType("success");
};
  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card shadow-lg border-0 p-4" style={{ width: "400px" }}>
        <div className="text-center mb-4">
          <h2 className="fw-bold">Campus Connect</h2>
          <p className="text-muted">Create your student account</p>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">
            Full Name
          </label>

          <input
            type="text"
            className="form-control"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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
          />
        </div>
        <div className="mb-3">
        <label className="form-label fw-semibold">
            USN
        </label>

        <input
            type="text"
            className="form-control"
            placeholder="Enter your USN"
            value={usn}
            onChange={(e) => setUsn(e.target.value)}
        />
        </div>

        <div className="mb-3">
        <label className="form-label fw-semibold">
            Department
        </label>

        <input
            type="text"
            className="form-control"
            placeholder="Enter your department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
        />
        </div>

        <div className="mb-3">
        <label className="form-label fw-semibold">
            Year
        </label>

        <select 
            className="form-select"
            value={year}
            onChange={(e) => setYear(e.target.value)}
        >
            <option value="">Select your year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
        </select>
        </div>
        <div className="mb-3">
        <label className="form-label fw-semibold">
            Password
        </label>

        <input
            type="password"
            className="form-control"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}     
        />
        </div>

        <div className="mb-3">
        <label className="form-label fw-semibold">
            Confirm Password
        </label>

        <input
            type="password"
            className="form-control"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
        />
        </div>
        <button
            type="button"
            className="btn btn-primary w-100"
            onClick={register}
        >
        Register
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
        {otpSent && (
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
            )}
      </div>
    </div>
  );
}