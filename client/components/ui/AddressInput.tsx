"use client";

import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';

interface AddressInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onTranslate?: (chineseAddress: string) => Promise<string>;
    placeholder?: string;
    required?: boolean;
    error?: string;
}

export default function AddressInput({
    label,
    value,
    onChange,
    onTranslate,
    placeholder = '',
    required = false,
    error
}: AddressInputProps) {
    const [isTranslating, setIsTranslating] = useState(false);
    const [translationError, setTranslationError] = useState<string | null>(null);

    const handleTranslate = async () => {
        if (!onTranslate || !value.trim()) return;

        setIsTranslating(true);
        setTranslationError(null);

        try {
            const translatedAddress = await onTranslate(value);
            if (!translatedAddress) {
                setTranslationError('查無此地址,請檢查中文');
            }
        } catch (error) {
            console.error('Translation error:', error);
            setTranslationError('查無此地址,請檢查中文');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder={placeholder}
                    required={required}
                />
                {onTranslate && (
                    <button
                        type="button"
                        onClick={handleTranslate}
                        disabled={isTranslating || !value.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                        title="翻譯成英文"
                    >
                        {isTranslating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                翻譯中...
                            </>
                        ) : (
                            <>
                                <Languages size={16} />
                                翻譯
                            </>
                        )}
                    </button>
                )}
            </div>
            {translationError && (
                <p className="text-red-500 text-xs flex items-center gap-1">
                    ⚠️ {translationError}
                </p>
            )}
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
    );
}
