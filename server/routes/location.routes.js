import express from "express";
import Turf from "../models/turf.model.js";

export const getStates = async (req, res) => {
  try {
    const states = await Turf.distinct("state", { status: "approved", isActive: true });
    return res.status(200).json({ states: states.filter(s => s).sort() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getCities = async (req, res) => {
  const { state } = req.query;
  try {
    const query = { status: "approved", isActive: true };
    if (state) query.state = state;
    const cities = await Turf.distinct("city", query);
    return res.status(200).json({ cities: cities.filter(c => c).sort() });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const router = express.Router();
router.get("/states", getStates);
router.get("/cities", getCities);

export default router;
