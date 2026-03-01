import { Router, Request, Response } from 'express';
import { getRoiData, getFilters } from '../services/roiService';

const router = Router();

router.get('/filters', async (_req: Request, res: Response) => {
  try {
    const filters = await getFilters();
    res.json({ success: true, data: filters });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch filters' });
  }
});

router.get('/roi-data', async (req: Request, res: Response) => {
  try {
    const { app, country, bidType, startDate, endDate, mode, window } = req.query;

    if (!app) {
      res.status(400).json({ success: false, error: 'app parameter is required' });
      return;
    }

    const result = await getRoiData({
      app: app as string,
      country: country as string | undefined,
      bidType: bidType as string | undefined,
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      mode: (mode as 'raw' | 'moving_avg') || 'raw',
      window: window ? parseInt(window as string, 10) : 7,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error fetching ROI data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ROI data' });
  }
});

export default router;
