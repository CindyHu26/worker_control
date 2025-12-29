
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { TAIWAN_CITIES } from '@/data/taiwan-cities';
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
    const [districts, setDistricts] = useState<string[]>([]);
    const [isTranslating, setIsTranslating] = useState(false);

    const zip = watch(zipField);
    const city = watch(cityField);
    const district = watch(districtField);
    const detail = watch(detailField);

    // Update districts when city changes
    useEffect(() => {
        if (city && TAIWAN_CITIES[city]) {
            setDistricts(TAIWAN_CITIES[city]);
            // If current district is not in new city list, clear it
            if (district && !TAIWAN_CITIES[city].includes(district)) {
                setValue(districtField, '');
            }
        } else {
            setDistricts([]);
        }
    }, [city, district, districtField, setValue]);

    // Auto-fill from Zip
    const handleZipBlur = async () => {
        if (!zip || zip.length < 3) return;

        try {
            const res = await fetch(`/api/address/lookup?zip=${zip}`);
            if (res.ok) {
                const data = await res.json();
                // data: { zip, city, district, fullEn }
                if (data.city) setValue(cityField, data.city);
                if (data.district) setValue(districtField, data.district);

                // If we also get English address part, we can store it temporarily or just use for translation later
                // But fullEn usually contains "Dist., City".
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
            // Avoid overwriting if user manually edited full address field separately? 
            // Design choice: fullAddressField is the source of truth for submission, but UI uses parts.
            // Check if fullAddressField matches what we expect, to avoid loops if we sync back.
            // For now, simple binding: changes in parts -> update full
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
            const res = await fetch(`/api/address/lookup?zip=${zip || ''}`); // Try lookup by zip first for accurate City/Dist En

            let cityEn = '';
            let districtEn = '';

            if (res.ok) {
                const data = await res.json();
                // Parse fullEn "Zhongzheng Dist., Taipei City"
                // Split by comma
                const parts = data.fullEn.split(',').map((p: string) => p.trim());
                if (parts.length >= 2) {
                    districtEn = parts[0];
                    cityEn = parts[1];
                }
            } else {
                // Fallback translation if API fails or zip not found
                // We should add client-side fallback using pinyin-pro if API fails
                // (Omitted for brevity, assuming API roughly works or we use utils)
            }

            // Translate Street part
            const streetEn = translateAddress(detail);

            // Compose: No. 123, Street, Dist., City, 10041, Taiwan
            // Format: Street, District, City Zip
            // Or: Street, District, City, Zip
            const fullEn = `${streetEn}, ${districtEn || district}, ${cityEn || city} ${zip || ''}, Taiwan (R.O.C.)`;

            setValue(englishAddressField, fullEn);
            toast.success('地址翻譯完成');
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
                            {Object.keys(TAIWAN_CITIES).map(cityName => (
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
