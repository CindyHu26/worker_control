/**
 * 驗證台灣統一編號 (GUI Number)
 * 規則：8碼數字，加權邏輯 (1, 2, 1, 2, 1, 2, 4, 1)
 */
export const isValidGUINumber = (taxId: string): boolean => {
    if (!/^\d{8}$/.test(taxId)) return false;

    const weights = [1, 2, 1, 2, 1, 2, 4, 1];
    let sum = 0;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let sumWithSeven = 0; // 處理第7位是7的特殊情況

    for (let i = 0; i < 8; i++) {
        const num = parseInt(taxId[i]);
        const product = num * weights[i];

        // 乘積之個位數與十位數相加
        const digitSum = Math.floor(product / 10) + (product % 10);
        sum += digitSum;

        // 特殊規則：第7位若為7，乘積為28，個十位相加為10 (1+0=1)。
        // 但舊制允許取另一種邏輯 (若第7位是7，可取 0 或 1)
        // 簡單算法：如果第7位是7，我們多算一種可能性 (sum + 1) -> 這裡用簡易版邏輯
        // 正統邏輯：
        // 第7位是7時，product=28, digitSum=10 => 1+0=1。
        // 另一個可能是當作 0 處理 (較少見，通常驗證能被 10 整除即可)
        if (i === 6 && num === 7) {
            sumWithSeven = sum + 1; // 另一種可能的總和 (當第7位是7時，最後結果若不能被10整除，可試試看減1或加1的變體，依財政部舊規)
            // 現代簡化寫法：若 (sum % 10 === 0) 或 ((sum - 1) % 10 === 0 && 第7位是7) 
        }
    }

    // 判斷是否能被 10 整除
    if (sum % 10 === 0) return true;
    // 第7位是7的特殊情況 (例如 1+0=1，但也接受 0 的情況)
    if (taxId[6] === '7' && (sum + 1) % 10 === 0) return true;

    return false;
};

/**
 * 驗證台灣身分證字號 (National ID)
 * 規則：1碼英文 + 9碼數字
 */
export const isValidNationalID = (id: string): boolean => {
    if (!/^[A-Z][1-2]\d{8}$/.test(id)) return false;

    const letterMap: { [key: string]: number } = {
        A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, J: 18, K: 19,
        L: 20, M: 21, N: 22, P: 23, Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29,
        X: 30, Y: 31, W: 32, Z: 33, I: 34, O: 35
    };

    const firstChar = id[0];
    const numPart = letterMap[firstChar];

    // 權重：首字需拆成個位與十位，權重分別為 1, 9
    // 後續數字權重：8, 7, 6, 5, 4, 3, 2, 1, 1
    const n1 = Math.floor(numPart / 10);
    const n2 = numPart % 10;

    const weights = [8, 7, 6, 5, 4, 3, 2, 1, 1];

    let sum = n1 * 1 + n2 * 9;

    for (let i = 0; i < 9; i++) {
        // id[1] 對應 weights[0]
        sum += parseInt(id[i + 1]) * weights[i];
    }

    return sum % 10 === 0;
};
