const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const SALT_ROUNDS = 10;
const JWT_EXPIRES = "7d";

const PASSWORD_RULE = /^(?=.{8,})(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/;

const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");
  return jwt.sign({ sub: userId }, secret, { expiresIn: JWT_EXPIRES });
};

const publicUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  displayName: user.displayName || "",
});

const register = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    const displayName = String(req.body.displayName || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    if (!PASSWORD_RULE.test(password)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include an uppercase letter and a symbol",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash, displayName });
    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Could not create account" });
  }
};

const login = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body.password || "");
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not sign in" });
  }
};

const googleAuth = async (req, res) => {
  try {
    const credential = String(req.body.credential || "");
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(503).json({ message: "Google sign-in is not configured" });
    }
    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = (payload.email || "").toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ message: "Google did not return an email" });
    }

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        if (user.googleId && user.googleId !== googleId) {
          return res.status(409).json({ message: "This email is linked to a different Google account" });
        }
        user.googleId = googleId;
        if (!user.displayName && payload.name) user.displayName = payload.name;
        await user.save();
      } else {
        user = await User.create({
          email,
          googleId,
          displayName: payload.name || "",
          passwordHash: null,
        });
      }
    }

    const token = signToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google sign-in failed" });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load profile" });
  }
};

module.exports = { register, login, googleAuth, me };
