import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { importCsvFile } from '../services/importService';

const router = Router();

const upload = multer({ dest: 'uploads/' });

router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    let filePath: string;
    const isUploadedFile = !!req.file;

    if (req.file) {
      filePath = req.file.path;
    } else {
      filePath = path.resolve(__dirname, '../../../app_roi_data.csv');
    }

    const result = await importCsvFile(filePath);

    if (isUploadedFile) {
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }

    res.json({ success: true, message: `Successfully imported ${result.imported} records`, ...result });
  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch { /* ignore */ }
    }
    console.error('Error importing CSV:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: `Failed to import CSV: ${message}` });
  }
});

export default router;
