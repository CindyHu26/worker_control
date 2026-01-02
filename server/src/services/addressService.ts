import fs from 'fs';
import path from 'path';

// In-memory data stores
const countyMap = new Map<string, string>(); // "臺北市信義區" -> "Xinyi Dist., Taipei City"
const zipCodeMap = new Map<string, { city: string, district: string }>(); // "110" -> { city: "臺北市", district: "信義區" }
const cityDistrictsMap = new Map<string, string[]>(); // "臺北市" -> ["中正區", "信義區", ...]
const reverseZipMap = new Map<string, string>(); // "臺北市中正區" -> "100"
const roadMap = new Map<string, string>();   // "信義路" -> "Xinyi Rd."
const villageMap = new Map<string, string>(); // "永吉里" -> "Yongji Vil."

// Global flag to track initialization
let isInitialized = false;

/**
 * Load CSV datasets on server startup
 */
export async function loadAddressDatasets() {
    if (isInitialized) {
        return;
    }

    try {
        const datasetPath = path.join(__dirname, '../../public/twaddress/data/dataset');

        // Load County/District data
        const countyData = fs.readFileSync(path.join(datasetPath, 'county_10706.csv'), 'utf-8');
        const countyLines = countyData.split('\n').filter(line => line.trim());

        // Temporary map to collect districts set to avoid duplicates
        const tempCityDistricts = new Map<string, Set<string>>();

        for (const rawLine of countyLines) {
            const line = rawLine.trim();
            // Format: 100,臺北市中正區,"Zhongzheng Dist., Taipei City"
            // We capture the zip code group now: ^(\d+)
            const match = line.match(/^(\d+),([^,]+),"?([^"]+)"?$/);
            if (match) {
                const zipCode = match[1].trim();
                const chineseName = match[2].trim();
                const englishName = match[3].trim().replace(/"/g, '');

                countyMap.set(chineseName, englishName);

                // Split City/District for Zip Code Map
                // Regex tries to find the boundary between City (ending in 縣/市) and District (ending in 區/鎮/鄉/市)
                // Note: "新竹市東區" matches City=新竹市, District=東區. "宜蘭縣宜蘭市" matches City=宜蘭縣, District=宜蘭市.
                // Special handling for "釣魚台", "南海諸島" which might not fit perfect patterns, regex might return null.
                const splitMatch = chineseName.match(/^(.+?[縣市])(.+?[區鎮鄉市])$/);
                if (splitMatch) {
                    const city = splitMatch[1];
                    const district = splitMatch[2];

                    zipCodeMap.set(zipCode, { city, district });
                    reverseZipMap.set(chineseName, zipCode); // "臺北市中正區" -> "100"

                    // Add to City/District Map
                    if (!tempCityDistricts.has(city)) {
                        tempCityDistricts.set(city, new Set());
                    }
                    tempCityDistricts.get(city)!.add(district);
                } else {
                    // Fallback for cases like "釣魚台" (no city/district structure)
                    // We treat the whole name as city or handle specifically if needed. 
                    // For now, let's treat the whole part as "District" with empty City if it doesn't match standard pattern, 
                    // or just ignore if it's not critical for the "City/District" dropdowns.
                    // Given the request is specific about "City"+"District" fields, we store what we can.
                    zipCodeMap.set(zipCode, {
                        city: '',
                        district: chineseName
                    });
                    // We don't add to cascading maps if it doesn't fit the structure
                }
            }
        }

        // Convert Sets to Arrays for the final map
        for (const [city, districtsSet] of tempCityDistricts) {
            // Sort districts might be nice? Keeping original order might be better if CSV is sorted.
            // But Sets don't guarantee order perfectly, so let's just convert.
            cityDistrictsMap.set(city, Array.from(districtsSet));
        }

        // Load Road data
        const roadData = fs.readFileSync(path.join(datasetPath, 'road_1130401.csv'), 'utf-8');
        const roadLines = roadData.split('\n').filter(line => line.trim());

        for (const line of roadLines) {
            // Format: 一工路,Yigong Rd.
            const parts = line.split(',');
            if (parts.length >= 2) {
                const chineseRoad = parts[0].trim();
                const englishRoad = parts[1].trim();
                roadMap.set(chineseRoad, englishRoad);
            }
        }

        // Load Village data
        const villageData = fs.readFileSync(path.join(datasetPath, 'village_11301.csv'), 'utf-8');
        const villageLines = villageData.split('\n').filter(line => line.trim());

        for (const line of villageLines) {
            // Format: 一心里,Yixin Vil.
            const parts = line.split(',');
            if (parts.length >= 2) {
                const chineseVillage = parts[0].trim();
                const englishVillage = parts[1].trim();
                villageMap.set(chineseVillage, englishVillage);
            }
        }


        console.log(`✅ Address datasets loaded: ${countyMap.size} counties, ${roadMap.size} roads, ${villageMap.size} villages, ${zipCodeMap.size} zip codes`);
        isInitialized = true;
    } catch (error) {
        console.error('❌ Failed to load address datasets:', error);
    }
}

/**
 * Parse a Taiwan address into components
 */
function parseAddress(address: string) {
    const components: any = {};

    // Remove common prefixes
    let addr = address.replace(/^台灣|^中華民國/, '').trim();

    // Extract City/County (縣/市)
    const cityMatch = addr.match(/^([^縣市]+[縣市])/);
    if (cityMatch) {
        components.city = cityMatch[1];
        addr = addr.substring(cityMatch[1].length);
    }

    // Extract District (區/鎮/鄉/市)
    const districtMatch = addr.match(/^([^區鎮鄉市]+[區鎮鄉市])/);
    if (districtMatch) {
        components.district = districtMatch[1];
        addr = addr.substring(districtMatch[1].length);
    }

    // Extract Village (村/里)
    const villageMatch = addr.match(/^([^村里]+[村里])/);
    if (villageMatch) {
        components.village = villageMatch[1];
        addr = addr.substring(villageMatch[1].length);
    }

    // Extract Neighborhood (鄰)
    const neighborhoodMatch = addr.match(/^(\d+鄰)/);
    if (neighborhoodMatch) {
        components.neighborhood = neighborhoodMatch[1];
        addr = addr.substring(neighborhoodMatch[1].length);
    }

    // Extract Road/Street (路/街/大道/巷/弄)
    const roadMatch = addr.match(/^([^路街大道巷弄號]+[路街]|[^大道]+大道)/);
    if (roadMatch) {
        components.road = roadMatch[1];
        addr = addr.substring(roadMatch[1].length);
    }

    // Extract Section (段)
    const sectionMatch = addr.match(/^([一二三四五六七八九十\d]+段)/);
    if (sectionMatch) {
        components.section = sectionMatch[1];
        addr = addr.substring(sectionMatch[1].length);
    }

    // Extract Lane (巷)
    const laneMatch = addr.match(/^(\d+巷)/);
    if (laneMatch) {
        components.lane = laneMatch[1];
        addr = addr.substring(laneMatch[1].length);
    }

    // Extract Alley (弄)
    const alleyMatch = addr.match(/^(\d+弄)/);
    if (alleyMatch) {
        components.alley = alleyMatch[1];
        addr = addr.substring(alleyMatch[1].length);
    }

    // Extract Number (號)
    const numberMatch = addr.match(/^(\d+號)/);
    if (numberMatch) {
        components.number = numberMatch[1];
        addr = addr.substring(numberMatch[1].length);
    }

    // Extract Floor (樓)
    const floorMatch = addr.match(/^([地下]*\d+樓|B\d+)/);
    if (floorMatch) {
        components.floor = floorMatch[1];
        addr = addr.substring(floorMatch[1].length);
    }

    // Extract Room (室/之)
    const roomMatch = addr.match(/^([之\d]+室?|之\d+)/);
    if (roomMatch) {
        components.room = roomMatch[1];
    }

    return components;
}

/**
 * Convert Chinese numbers to Arabic
 */
function chineseToArabic(chinese: string): string {
    const map: any = {
        '一': '1', '二': '2', '三': '3', '四': '4', '五': '5',
        '六': '6', '七': '7', '八': '8', '九': '9', '十': '10'
    };
    return map[chinese] || chinese;
}

/**
 * Translate a Taiwan address to English
 */
export function translateAddress(address: string): string {
    const components = parseAddress(address);
    const parts: string[] = [];

    // Room/Floor (if exists)
    if (components.room) {
        parts.push(components.room.replace('室', '').replace('之', '-'));
    }
    if (components.floor) {
        const floorNum = components.floor.replace('樓', '').replace('地下', 'B');
        parts.push(`${floorNum}F`);
    }

    // Number (號)
    if (components.number) {
        const num = components.number.replace('號', '');
        parts.push(`No. ${num}`);
    }

    // Alley (弄)
    if (components.alley) {
        const alley = components.alley.replace('弄', '');
        parts.push(`Aly. ${alley}`);
    }

    // Lane (巷)
    if (components.lane) {
        const lane = components.lane.replace('巷', '');
        parts.push(`Ln. ${lane}`);
    }

    // Section (段)
    if (components.section) {
        const sec = components.section.replace('段', '');
        const secNum = chineseToArabic(sec);
        parts.push(`Sec. ${secNum}`);
    }

    // Road (路/街)
    if (components.road) {
        const roadEn = roadMap.get(components.road);
        if (roadEn) {
            parts.push(roadEn);
        } else {
            // Fallback: keep Chinese or attempt basic translation
            parts.push(components.road);
        }
    }

    // Village (村/里)
    if (components.village) {
        const villageEn = villageMap.get(components.village);
        if (villageEn) {
            parts.push(villageEn);
        } else {
            parts.push(components.village);
        }
    }

    // Neighborhood (鄰)
    if (components.neighborhood) {
        const num = components.neighborhood.replace('鄰', '');
        parts.push(`${num}th Neighborhood`);
    }

    // District + City (combined lookup)
    if (components.city && components.district) {
        const fullName = components.city + components.district;
        const countyEn = countyMap.get(fullName);
        if (countyEn) {
            parts.push(countyEn);
        } else {
            // Try separate lookup
            const cityEn = countyMap.get(components.city);
            const districtEn = countyMap.get(components.district);
            if (cityEn) parts.push(cityEn);
            else if (districtEn) parts.push(districtEn);
            else parts.push(fullName);
        }
    } else if (components.city) {
        const cityEn = countyMap.get(components.city);
        parts.push(cityEn || components.city);
    } else if (components.district) {
        const districtEn = countyMap.get(components.district);
        parts.push(districtEn || components.district);
    }

    return parts.join(', ');
}

/**
 * Lookup City and District by Zip Code
 */
export function lookupByZipCode(zipCode: string) {
    return zipCodeMap.get(zipCode) || null;
}

/**
 * Get all available Cities
 */
export function getCities(): string[] {
    return Array.from(cityDistrictsMap.keys());
}

/**
 * Get Districts for a given City
 */
export function getDistricts(city: string): string[] {
    return cityDistrictsMap.get(city) || [];
}

/**
 * Get Zip Code for City and District
 */
export function getZipCode(city: string, district: string): string | null {
    const fullName = city + district;
    return reverseZipMap.get(fullName) || null;
}

export const addressService = {
    loadAddressDatasets,
    translateAddress,
    lookupByZipCode,
    getCities,
    getDistricts,
    getZipCode
};
