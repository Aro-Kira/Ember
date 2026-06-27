import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const isNetlify = !!process.env.NETLIFY;

// Supabase Storage client (used on Netlify)
const supabase = isNetlify && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Memory storage works on both disk and serverless
const memoryStorage = multer.memoryStorage();

// Disk storage only for traditional servers
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/announcements'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `announcement-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
  }
};

const upload = multer({
  storage: isNetlify ? memoryStorage : diskStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/', authenticateToken, (req, res) => {
  if (req.user.role !== 'leader') {
    return res.status(403).json({ error: 'Leaders only' });
  }

  upload.single('coverImage')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size must be under 5MB' });
        }
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Supabase Storage upload (Netlify)
    if (isNetlify && supabase) {
      try {
        const ext = path.extname(req.file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const storagePath = `announcements/announcement-${uniqueSuffix}${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype,
          });

        if (uploadError) {
          return res.status(500).json({ error: uploadError.message });
        }

        const { data: urlData } = supabase.storage
          .from('uploads')
          .getPublicUrl(storagePath);

        return res.json({ url: urlData.publicUrl });
      } catch (e) {
        return res.status(500).json({ error: 'Upload failed' });
      }
    }

    // Local disk upload (traditional server)
    const imageUrl = `/uploads/announcements/${req.file.filename}`;
    res.json({ url: imageUrl });
  });
});

export default router;
