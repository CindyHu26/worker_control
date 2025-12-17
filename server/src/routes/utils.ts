import express from 'express';
import { addressService } from '../services/addressService';

const router = express.Router();

/**
 * POST /api/utils/translate-address
 * Translate a Taiwan address from Chinese to English
 */
router.post('/translate-address', (req, res) => {
    try {
        const { address } = req.body;

        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Address is required and must be a string' });
        }

        const addressEn = addressService.translateAddress(address);

        res.json({ addressEn });
    } catch (error) {
        console.error('Address Translation Error:', error);
        res.status(500).json({ error: 'Failed to translate address' });
    }
});

export default router;
