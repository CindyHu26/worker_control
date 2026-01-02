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

/**
 * GET /api/utils/lookup?zipCode=100
 * Lookup City and District by Zip Code
 */
router.get('/lookup', (req, res) => {
    try {
        const { zipCode } = req.query;

        if (!zipCode || typeof zipCode !== 'string') {
            return res.status(400).json({ error: 'Zip Code is required' });
        }

        const result = addressService.lookupByZipCode(zipCode);

        if (!result) {
            return res.status(404).json({ error: 'Zip Code not found' });
        }

        res.json(result);
    } catch (error) {
        console.error('Address Lookup Error:', error);
        res.status(500).json({ error: 'Failed to lookup address' });
    }
});

/**
 * GET /api/utils/cities
 * Get all available Taiwan cities
 */
router.get('/cities', (req, res) => {
    try {
        const cities = addressService.getCities();
        res.json(cities);
    } catch (error) {
        console.error('Cities Lookup Error:', error);
        res.status(500).json({ error: 'Failed to lookup cities' });
    }
});

/**
 * GET /api/utils/districts?city=臺北市
 * Get districts for a city
 */
router.get('/districts', (req, res) => {
    try {
        const { city } = req.query;
        if (!city || typeof city !== 'string') {
            return res.status(400).json({ error: 'City is required' });
        }

        const districts = addressService.getDistricts(city);
        res.json(districts);
    } catch (error) {
        console.error('Districts Lookup Error:', error);
        res.status(500).json({ error: 'Failed to lookup districts' });
    }
});

/**
 * GET /api/utils/zip-code?city=臺北市&district=中正區
 * Get Zip Code by City/District
 */
router.get('/zip-code', (req, res) => {
    try {
        const { city, district } = req.query;
        if (!city || typeof city !== 'string' || !district || typeof district !== 'string') {
            return res.status(400).json({ error: 'City and District are required' });
        }

        const zipCode = addressService.getZipCode(city, district);
        if (!zipCode) {
            return res.status(404).json({ error: 'Zip Code not found' });
        }

        res.json({ zipCode });
    } catch (error) {
        console.error('Zip Code Lookup Error:', error);
        res.status(500).json({ error: 'Failed to lookup zip code' });
    }
});

/**
 * POST /api/utils/translate-address
 * Translate Chinese address to English
 */
router.post('/translate-address', (req, res) => {
    try {
        const { address } = req.body;
        if (!address || typeof address !== 'string') {
            return res.status(400).json({ error: 'Address is required' });
        }

        const addressEn = addressService.translateAddress(address);
        res.json({ addressEn });
    } catch (error) {
        console.error('Translation Error:', error);
        res.status(500).json({ error: 'Failed to translate address' });
    }
});

export default router;
