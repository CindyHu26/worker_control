import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Cache the address data
let addressDataCache: any[] | null = null;

const loadAddressData = () => {
    if (addressDataCache) return addressDataCache;

    try {
        const filePath = path.join(process.cwd(), 'public/twaddress/data/dataset/county_10706.csv');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const lines = fileContent.split('\n');

        const data = lines
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                // CSV format: 100,臺北市中正區,"Zhongzheng Dist., Taipei City"
                // Parse manually to handle quotes
                const parts = [];
                let current = '';
                let inQuote = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        inQuote = !inQuote;
                    } else if (char === ',' && !inQuote) {
                        parts.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                parts.push(current);

                if (parts.length >= 3) {
                    const zip = parts[0].trim();
                    const fullZh = parts[1].trim(); // e.g. 臺北市中正區
                    const fullEn = parts[2].replace(/"/g, '').trim(); // e.g. Zhongzheng Dist., Taipei City

                    // Splitting ZH to City/District is tricky without map, 
                    // but usually City is 3 chars. 
                    // Exception: New Taipei City (新北市), etc. 
                    // Let's assume standard 3 char city.
                    let city = fullZh.substring(0, 3);
                    let district = fullZh.substring(3);

                    // Handling special cases if needed, but standard cities are 3 chars

                    return { zip, city, district, fullEn };
                }
                return null;
            })
            .filter(item => item !== null);

        addressDataCache = data;
        return data;
    } catch (error) {
        console.error('Failed to load address data:', error);
        return [];
    }
};

router.get('/lookup', (req: Request, res: Response) => {
    const zip = req.query.zip as string;

    if (!zip) {
        return res.status(400).json({ error: 'Zip code is required' });
    }

    const data = loadAddressData();
    // Find closest match or exact match
    // Support 3-digit zip search in 3+2 or 3+3 codes
    const match = data?.find(item => item.zip === zip || item.zip.startsWith(zip));

    if (match) {
        res.json(match);
    } else {
        res.status(404).json({ error: 'Address not found' });
    }
});

export default router;
