import express from "express";
import { 
  getAllProfessionals, 
  getProfessionalById, 
  bookProfessional, 
  updateAvailability, 
  getMyBookings, 
  handleBookingRequest, 
  addProfessionalReview, 
  replyToReview,
  updateProfessionalProfile
} from "./professional.controller.js";
import protect from "../../middleware/jwt/auth.middleware.js";

const router = express.Router();

// User Routes
router.get("/list", getAllProfessionals);
router.get("/details/:id", getProfessionalById);
router.post("/book", protect, bookProfessional);
router.post("/review", protect, addProfessionalReview);

// Professional (Owner) Routes
router.put("/availability", protect, updateAvailability);
router.get("/my-bookings", protect, getMyBookings);
router.post("/handle-request", protect, handleBookingRequest);
router.post("/review/reply", protect, replyToReview);
router.put("/update-profile", protect, updateProfessionalProfile);

export default router;
