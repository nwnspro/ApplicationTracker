import { Router } from "express";

const router = Router();

// Get current user info
// Note: This route is not needed with Supabase Auth
// User info is managed client-side via Supabase Auth
router.get("/me", (req, res) => {
  res.json({
    message: "User info is managed via Supabase Auth on the client side"
  });
});

export default router;
