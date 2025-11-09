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
IMPLEMENTATION GUIDE:
To enable UploadThing file uploads:

1. Install the package:
   npm install uploadthing

2. Set environment variables in .env:
   UPLOADTHING_APP_ID=your_app_id
   UPLOADTHING_SECRET=your_secret_key

3. Uncomment and use this implementation:

import { createRouteHandler } from "uploadthing/server";
import { ourFileRouter } from "../utils/uploadthing";
import { auth } from "../middleware/auth";

router.use(auth);

const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
  config: {
    uploadthingId: process.env["UPLOADTHING_APP_ID"],
    uploadthingSecret: process.env["UPLOADTHING_SECRET"],
  },
});

router.get("/api/uploadthing", (req, res) => GET(req, res));
router.post("/api/uploadthing", (req, res) => POST(req, res));
*/
