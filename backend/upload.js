import multer from "multer";
import path from "path";
import { v4 as uuid } from "uuid";

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith("audio/")) {
      cb(new Error("Only audio files allowed"));
    }
    cb(null, true);
  }
});
