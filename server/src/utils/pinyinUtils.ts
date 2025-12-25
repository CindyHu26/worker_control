import { pinyin } from 'pinyin-pro';

export const toPinyin = (text: string): string => {
    if (!text) return '';
    return pinyin(text, {
        mode: 'surname', // 姓氏模式對人名較準確
        toneType: 'none',
        type: 'array'
    }).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
};
