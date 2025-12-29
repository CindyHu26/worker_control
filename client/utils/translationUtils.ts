
import { pinyin } from 'pinyin-pro';

export const translateCityDistrict = (city: string, district: string): { cityEn: string, districtEn: string } => {
    // Simple mapping or pinyin fallback
    // For a production app, a complete map is better. Here leveraging pinyin for simplicity as user requested "translation"
    // But standard city names are specific.
    // Using a partial map for major cities and pinyin for others as a fallback

    const cityMap: Record<string, string> = {
        "臺北市": "Taipei City",
        "新北市": "New Taipei City",
        "桃園市": "Taoyuan City",
        "臺中市": "Taichung City",
        "臺南市": "Tainan City",
        "高雄市": "Kaohsiung City",
        "基隆市": "Keelung City",
        "新竹市": "Hsinchu City",
        "嘉義市": "Chiayi City",
        "新竹縣": "Hsinchu County",
        "苗栗縣": "Miaoli County",
        "彰化縣": "Changhua County",
        "南投縣": "Nantou County",
        "雲林縣": "Yunlin County",
        "嘉義縣": "Chiayi County",
        "屏東縣": "Pingtung County",
        "宜蘭縣": "Yilan County",
        "花蓮縣": "Hualien County",
        "臺東縣": "Taitung County",
        "澎湖縣": "Penghu County",
        "金門縣": "Kinmen County",
        "連江縣": "Lienchiang County"
    };

    const cityEn = cityMap[city] || pinyin(city, { mode: 'surname', toneType: 'none', type: 'array' }).map(capitalize).join(' ');
    // Districts will largely be handled by the Address API now, but keeping this as fallback
    const districtEn = pinyin(district, { mode: 'surname', toneType: 'none', type: 'array' }).map(capitalize).join(' ');

    return { cityEn, districtEn };
};

export const translateAddress = (address: string): string => {
    // This function is less critical if we use the component-based translation logic
    // but useful for generic text.
    let result = address
        .replace(/號/g, 'No. ')
        .replace(/樓/g, 'F')
        .replace(/段/g, 'Sec. ')
        .replace(/巷/g, 'Ln. ')
        .replace(/弄/g, 'Aly. ')
        .replace(/路/g, 'Rd. ')
        .replace(/街/g, 'St. ')
        .replace(/大道/g, 'Blvd. ');

    return toPinyin(result);
};

export const toPinyin = (text: string): string => {
    if (!text) return '';
    return pinyin(text, {
        mode: 'surname',
        toneType: 'none',
        type: 'array'
    }).map(capitalize).join(' ');
};

export const toCompanyEnglish = (text: string): string => {
    if (!text) return '';

    // Extract suffix
    let suffix = '';
    let mainName = text;

    if (text.includes('股份有限公司')) {
        suffix = ' Co., Ltd.';
        mainName = text.replace('股份有限公司', '');
    } else if (text.includes('有限公司')) {
        suffix = ' Ltd.';
        mainName = text.replace('有限公司', '');
    } else if (text.includes('企業社')) {
        suffix = ' Enterprise';
        mainName = text.replace('企業社', '');
    } else if (text.includes('企業')) {
        suffix = ' Enterprise';
        mainName = text.replace('企業', '');
    } else if (text.includes('實業')) {
        suffix = ' Industrial';
        mainName = text.replace('實業', '');
    } else if (text.includes('工業')) {
        suffix = ' Industrial';
        mainName = text.replace('工業', '');
    } else if (text.includes('科技')) {
        suffix = ' Technology';
        mainName = text.replace('科技', '');
    }

    const pinyinName = pinyin(mainName, {
        mode: 'surname',
        toneType: 'none',
        type: 'array'
    }).map(capitalize).join(' ');

    return pinyinName + suffix;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
