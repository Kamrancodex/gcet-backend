// This file is currently disabled as uploadthing package is not installed
// To enable file uploads with UploadThing:
// 1. Install package: npm install uploadthing
// 2. Uncomment the code below
// 3. Uncomment the import and route in server.ts

import { Router } from "express";

const router = Router();

// Placeholder routes - return 501 Not Implemented
router.get("/api/uploadthing", (_req, res) => {
  res.status(501).json({
    error: "File upload not configured",
    message:
      "UploadThing package is not installed. Contact administrator to enable file uploads.",
  });
});

router.post("/api/uploadthing", (_req, res) => {
  res.status(501).json({
    error: "File upload not configured",
    message:
      "UploadThing package is not installed. Contact administrator to enable file uploads.",
  });
});

export default router;

/*
// Original implementation - uncomment when uploadthing is installed
import { Router } from "express";
import { createRouteHandler } from "uploadthing/server";
import { ourFileRouter } from "../utils/uploadthing";
import { auth } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all upload routes
router.use(auth);

// Create the UploadThing route handler
const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    uploadthingId: process.env["UPLOADTHING_APP_ID"] || "0p4mm0ohn6",
    uploadthingSecret:
      process.env["UPLOADTHING_SECRET"] ||
      "sk_live_c7924508d294a39fe1156d5b0b0bcdb8ac53b9881a708cc152d7ec97fd662b53",
  },
});

// Handle GET requests (for getting upload URLs)
router.get("/api/uploadthing", (req, res) => GET(req, res));

// Handle POST requests (for completing uploads)
router.post("/api/uploadthing", (req, res) => POST(req, res));

export default router;
*/
