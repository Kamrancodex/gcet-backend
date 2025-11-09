// This file is currently disabled as uploadthing package is not installed
// To enable file uploads with UploadThing:
// 1. Install package: npm install uploadthing
// 2. Uncomment the code below
// 3. Uncomment the uploadthing routes in server.ts

/*
import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

const auth = (req: any) => ({ id: "fakeId" });

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),

  // Student document uploader
  documentUploader: f({ pdf: { maxFileSize: "8MB" }, image: { maxFileSize: "4MB" } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Document uploaded for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),

  // Notice attachment uploader
  noticeAttachmentUploader: f({ pdf: { maxFileSize: "16MB" }, image: { maxFileSize: "8MB" } })
    .middleware(async ({ req }) => {
      const user = await auth(req);
      if (!user) throw new Error("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Notice attachment uploaded for userId:", metadata.userId);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
*/

// Placeholder export to avoid import errors
export const ourFileRouter = {};
export type OurFileRouter = typeof ourFileRouter;
