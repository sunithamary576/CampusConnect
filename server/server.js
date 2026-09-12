const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;

  if (!email || !email.toLowerCase().endsWith("@cmrit.ac.in")) {
    return res.status(400).json({
      message: "Please use your CMRIT college email.",
    });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  otpStore[email.toLowerCase()] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Campus Connect OTP",
      text: `Your Campus Connect verification OTP is ${otp}. It is valid for 5 minutes.`,
    });

    res.json({
      message: "OTP sent successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to send OTP.",
    });
  }
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const record = otpStore[email?.toLowerCase()];

  if (!record) {
    return res.status(400).json({
      message: "OTP not found. Please request a new OTP.",
    });
  }

  if (Date.now() > record.expiresAt) {
    delete otpStore[email.toLowerCase()];

    return res.status(400).json({
      message: "OTP expired. Please request a new OTP.",
    });
  }

  if (record.otp !== otp) {
    return res.status(400).json({
      message: "Incorrect OTP.",
    });
  }

  delete otpStore[email.toLowerCase()];

  res.json({
    message: "Email verified successfully.",
  });
});

app.listen(5000, () => {
  console.log("Campus Connect server running on port 5000");
});