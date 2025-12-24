import express from 'express';
import { iocService } from '../services/iocService';

const router = express.Router();

// GET /api/iocs
router.get('/', (req, res) => {
  try {
    const iocs = iocService.getIocs();
    res.json(iocs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch IOCs' });
  }
});

// POST /api/iocs
router.post('/', (req, res) => {
  try {
    const { type, value, severity, description, enabled, source, mitreAttack } = req.body;
    if (!type || !value || !severity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const newIoc = iocService.addIoc({
      type,
      value,
      severity,
      description,
      enabled,
      source,
      mitreAttack
    });
    res.status(201).json(newIoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add IOC' });
  }
});

// DELETE /api/iocs/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    iocService.removeIoc(id);
    res.status(200).json({ message: 'IOC removed' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove IOC' });
  }
});

export default router;
