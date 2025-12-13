/**
 * ECPay E-Invoice Configuration
 * 
 * For development/testing, use ECPay's Stage environment credentials.
 * For production, replace with actual production credentials.
 * 
 * Documentation: https://www.ecpay.com.tw/Service/API_Dwnld
 */

export const ECPayConfig = {
    // Environment
    environment: process.env.ECPAY_ENV || 'stage', // 'stage' or 'production'

    // Stage/Test Credentials (公開測試帳號)
    stage: {
        merchantId: '2000132',
        hashKey: 'ejCk326UnaZWKisg',
        hashIV: 'q9jcZX8Ib9LM8wYk',
        apiUrl: 'https://einvoice-stage.ecpay.com.tw',
    },

    // Production Credentials (請替換為實際帳號)
    production: {
        merchantId: process.env.ECPAY_MERCHANT_ID || '',
        hashKey: process.env.ECPAY_HASH_KEY || '',
        hashIV: process.env.ECPAY_HASH_IV || '',
        apiUrl: 'https://einvoice.ecpay.com.tw',
    },

    // Get active config based on environment
    getConfig() {
        return this.environment === 'production' ? this.production : this.stage;
    },

    // Invoice Settings
    invoiceSettings: {
        // 發票類型
        invoiceType: '07', // 07: 一般稅額

        // 課稅類別
        taxType: '1', // 1: 應稅, 2: 零稅率, 3: 免稅

        // 字軌類別
        invoiceCategory: 'B2C', // B2C or B2B

        // 預設列印註記
        defaultPrintMark: 'N', // Y: 要印, N: 不印

        // 預設捐贈註記
        defaultDonation: '0', // 0: 不捐, 1: 捐贈

        // 載具類別代號
        carrierTypes: {
            none: '',
            mobile: '3J0002', // 手機條碼
            citizenDigital: 'CQ0001', // 自然人憑證
            ecpayMember: '1K0001', // ECPay會員載具
        },

        // 發票備註
        defaultRemark: 'TMS System - Migrant Worker Services',
    },
};

/**
 * Generate CheckMacValue for ECPay API
 * ECPay uses URL-encoded parameters sorted alphabetically with HashKey/HashIV
 */
export function generateCheckMacValue(params: Record<string, any>): string {
    const config = ECPayConfig.getConfig();

    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();

    // Build query string
    let queryString = `HashKey=${config.hashKey}`;
    sortedKeys.forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            queryString += `&${key}=${params[key]}`;
        }
    });
    queryString += `&HashIV=${config.hashIV}`;

    // URL encode
    queryString = encodeURIComponent(queryString).toLowerCase();

    // Calculate MD5 (Note: In production, use crypto module)
    // For now, return placeholder - implement with crypto.createHash('md5')
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(queryString).digest('hex').toUpperCase();

    return hash;
}

export default ECPayConfig;
