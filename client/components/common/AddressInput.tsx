
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';

import { toast } from 'sonner';
import { translateAddress } from '@/utils/translationUtils';

interface AddressInputProps {
    zipField: string;
    cityField: string;
    districtField: string;
    detailField: string; // The street/detail part
    fullAddressField: string; // The combined Chinese address
    englishAddressField: string;
    labelPrefix?: string;
}

export default function AddressInput({
    zipField,
    cityField,
    districtField,
    detailField,
    fullAddressField,
    englishAddressField,
    labelPrefix = ''
}: AddressInputProps) {
    const { register, watch, setValue } = useFormContext();
    const [cities, setCities] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [isTranslating, setIsTranslating] = useState(false);

    const zip = watch(zipField);
    const city = watch(cityField);
    const district = watch(districtField);
    const detail = watch(detailField);

    // Initial Fetch Cities
    useEffect(() => {
        fetch('/api/utils/cities')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCities(data);
                }
            })
            .catch(err => console.error('Failed to fetch cities:', err));
    }, []);

    // Fetch Districts when city changes
    useEffect(() => {
        if (city) {
            fetch(`/api/utils/districts?city=${city}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setDistricts(data);
                        // Validate current district
                        if (district && !data.includes(district)) {
                            setValue(districtField, '');
                        }
                    }
                })
                .catch(err => console.error('Failed to fetch districts:', err));
        } else {
            setDistricts([]);
            setValue(districtField, '');
        }
    }, [city, setValue, districtField]);

    // Auto-fill Zip when City/District changes
    useEffect(() => {
        if (city && district) {
            // Check if current zip matches already? 
            // We only autofill if zip is empty or we want to force consistency.
            // Usually valid to overwrite to ensure correctness.
            // But we must debounce or avoid conflict with manual zip typing.
            // Let's only fetch if zip is empty OR if the user just selected city/district

            fetch(`/api/utils/zip-code?city=${city}&district=${district}`)
                .then(res => res.json())
                .then(data => {
                    if (data.zipCode && data.zipCode !== zip) {
                        setValue(zipField, data.zipCode);
                    }
                })
                .catch(() => {
                    // Ignore 404
                });
        }
    }, [city, district, setValue, zipField]); // Removed zip from dependency to avoid loop? No, if zip changes we don't need to re-fetch zip.

    // Auto-fill from Zip Manual Entry
    const handleZipBlur = async () => {
        if (!zip || zip.length < 3) return;

        try {
            const res = await fetch(`/api/utils/lookup?zipCode=${zip}`);
            if (res.ok) {
                const data = await res.json();
                // data: { city, district }
                if (data.city) setValue(cityField, data.city);
                if (data.district) setValue(districtField, data.district);
            }
        } catch (error) {
            console.error('Failed to lookup address:', error);
        }
    };

    // Compose Full Address
    useEffect(() => {
        // Only compose if we have at least city and district
        if (city && district) {
            const composed = `${zip || ''}${city}${district}${detail || ''}`;
            setValue(fullAddressField, composed, { shouldValidate: true });
        }
    }, [zip, city, district, detail, fullAddressField, setValue]);

    // Handle Translation
    const handleTranslate = async () => {
        if (!city || !district || !detail) {
            toast.error('請先填寫完整地址 (縣市、鄉鎮市區、路段)');
            return;
        }

        setIsTranslating(true);
        try {
            const res = await fetch(`/api/utils/lookup?zipCode=${zip || ''}`); // Try lookup by zip first for accurate City/Dist En

            let cityEn = '';
            let districtEn = '';

            if (res.ok) {
                // Since we don't have full english address in simple lookup anymore (addressService provides city/dist maps),
                // we might need to rely on translation utils or enhance lookup.
                // Re-checking addressService... it stores English names in countyMap!
                // But my /lookup endpoint currently returns { city: "xxx", district: "yyy" } from zipCodeMap.
                // It does NOT return English names.
                // I should update /lookup or use `translateAddress` from utils.

                // Let's use the explicit translation endpoint or utils if available.
                // The original code tried to use lookup data. 
                // Let's call /api/utils/translate-address (if it exists) or rely on `translateAddress` imported from client utils.
                // But client `translateAddress` (from '@/utils/translationUtils') might be basic.
                // The server has a robust one.

                // Use Server-side translation
                const fullAddr = `${zip || ''}${city}${district}${detail}`;
                const transRes = await fetch('/api/utils/translate-address', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address: fullAddr })
                });

                if (transRes.ok) {
                    const transData = await transRes.json();
                    setValue(englishAddressField, transData.addressEn);
                    toast.success('地址翻譯完成');
                    return;
                }
            } else {
                // Fallback
            }

            // Fallback to client-side or error
            const streetEn = translateAddress(detail);
            // Basic fallback
            setValue(englishAddressField, `${streetEn}, ${district}, ${city} ${zip || ''}, Taiwan`);
            toast.success('地址翻譯完成 (僅部分翻譯)');

        } catch (error) {
            console.error('Translation failed', error);
            toast.error('翻譯失敗');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-6 gap-2">
                <div className="col-span-1">
                    <Label>{labelPrefix}郵遞區號</Label>
                    <Input
                        {...register(zipField)}
                        placeholder="Zip"
                        onBlur={handleZipBlur}
                    />
                </div>
                <div className="col-span-2">
                    <Label>{labelPrefix}縣市</Label>
                    <Select
                        value={city}
                        onValueChange={(val) => setValue(cityField, val)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="選擇縣市" />
                        </SelectTrigger>
                        <SelectContent>
                            {cities.map(cityName => (
                                <SelectItem key={cityName} value={cityName}>{cityName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-3">
                    <Label>{labelPrefix}鄉鎮市區</Label>
                    <Select
                        value={district}
                        onValueChange={(val) => setValue(districtField, val)}
                        disabled={!city}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="選擇鄉鎮市區" />
                        </SelectTrigger>
                        <SelectContent>
                            {districts.map(dist => (
                                <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-2">
                <div className="col-span-12 md:col-span-8">
                    <Label>{labelPrefix}路段/詳細地址</Label>
                    <Input
                        {...register(detailField)}
                        placeholder="例: 中山路一段1號5樓"
                    />
                </div>
                <div className="col-span-12 md:col-span-4 flex items-end">
                    {/* Hidden full Chinese address input for submission if needed, 
                         or just rely on the onEffect composition */}
                    <input type="hidden" {...register(fullAddressField)} />

                    <div className="w-full">
                        <Label>&nbsp;</Label>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
                            onClick={handleTranslate}
                            disabled={isTranslating}
                        >
                            <Globe className="w-4 h-4 mr-2" />
                            {isTranslating ? '翻譯中...' : '翻譯成英文地址'}
                        </Button>
                    </div>
                </div>
            </div>

            <div>
                <Label>{labelPrefix}英文地址</Label>
                <Input {...register(englishAddressField)} placeholder="Address in English" />
            </div>
        </div>
    );
}
