'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import useSWR, { mutate } from 'swr';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Home, Building2, MapPin, History } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Zod Schema
const relocationSchema = z.object({
    effectiveDate: z.string().min(1, "Effective date is required"),
    type: z.enum(['DORMITORY', 'EXTERNAL']),
    dormitoryId: z.string().optional(),
    roomId: z.string().optional(),
    bedId: z.string().optional(),
    address: z.string().optional()
}).refine((data) => {
    if (data.type === 'DORMITORY') {
        return !!data.bedId;
    }
    if (data.type === 'EXTERNAL') {
        return !!data.address;
    }
    return false;
}, {
    message: "Please complete the location details",
    path: ["address"] // Error path
});

type RelocationFormValues = z.infer<typeof relocationSchema>;

export default function RelocateWorkerPage() {
    const params = useParams();
    const router = useRouter();
    const workerId = params.id as string;

    const { data: worker } = useSWR(workerId ? `/api/workers/${workerId}` : null, fetcher);
    const { data: history } = useSWR(workerId ? `/api/relocation/worker/${workerId}` : null, fetcher);
    const { data: dormitories } = useSWR('/api/dormitories', fetcher);

    const [selectedDorm, setSelectedDorm] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const { data: dormStructure } = useSWR(selectedDorm ? `/api/dormitories/${selectedDorm}/structure` : null, fetcher);

    const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<RelocationFormValues>({
        resolver: zodResolver(relocationSchema),
        defaultValues: {
            type: 'DORMITORY',
            effectiveDate: format(new Date(), 'yyyy-MM-dd')
        }
    });

    const type = watch('type');
    const today = format(new Date(), 'yyyy-MM-dd');

    // Handle Dorm/Room Selection changes
    useEffect(() => {
        if (type === 'DORMITORY') {
            setValue('address', undefined);
        } else {
            setValue('dormitoryId', undefined);
            setValue('roomId', undefined);
            setValue('bedId', undefined);
            setSelectedDorm(null);
            setSelectedRoom(null);
        }
    }, [type, setValue]);

    const onSubmit = async (data: RelocationFormValues) => {
        try {
            const payload = {
                workerId,
                effectiveDate: data.effectiveDate,
                newLocation: data.type === 'DORMITORY'
                    ? { bedId: data.bedId }
                    : { address: data.address }
            };

            const res = await fetch('/api/relocation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to relocate');
            }

            toast.success('Relocation processed successfully');
            // Refresh history
            mutate(`/api/relocation/worker/${workerId}`);
            // Redirect back to worker details after delay
            setTimeout(() => {
                router.push(`/workers/${workerId}`);
            }, 1000);

        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (!worker) return <div className="p-8">Loading worker...</div>;

    // Helper to get rooms and beds
    const rooms = dormStructure?.rooms || [];
    const beds = selectedRoom ? rooms.find((r: any) => r.id === selectedRoom)?.beds || [] : [];

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Relocate Worker</h1>
                    <p className="text-gray-500">{worker.englishName} {worker.chineseName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Home className="w-5 h-5 text-blue-600" />
                        New Accommodation
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Effective Date */}
                        <div>
                            <label className="block text-sm font-medium mb-1">Effective Date</label>
                            <input
                                type="date"
                                {...register('effectiveDate')}
                                className="w-full p-2 border rounded-lg"
                            />
                            {errors.effectiveDate && <p className="text-red-500 text-sm">{errors.effectiveDate.message}</p>}
                        </div>

                        {/* Type Selection */}
                        <div className="flex gap-4">
                            <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-colors ${type === 'DORMITORY' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    value="DORMITORY"
                                    className="hidden"
                                    {...register('type')}
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <Building2 className={`w-8 h-8 ${type === 'DORMITORY' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className="font-medium">Company Dormitory</span>
                                </div>
                            </label>

                            <label className={`flex-1 p-4 border rounded-xl cursor-pointer transition-colors ${type === 'EXTERNAL' ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="radio"
                                    value="EXTERNAL"
                                    className="hidden"
                                    {...register('type')}
                                />
                                <div className="flex flex-col items-center gap-2">
                                    <MapPin className={`w-8 h-8 ${type === 'EXTERNAL' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className="font-medium">External Address</span>
                                </div>
                            </label>
                        </div>

                        {/* Dynamic Fields */}
                        {type === 'DORMITORY' && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg animate-in fade-in">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Dormitory</label>
                                    <select
                                        className="w-full p-2 border rounded-lg bg-white"
                                        onChange={(e) => {
                                            setSelectedDorm(e.target.value);
                                            setSelectedRoom(null);
                                        }}
                                    >
                                        <option value="">Select Dormitory</option>
                                        {dormitories?.map((d: any) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Room</label>
                                    <select
                                        className="w-full p-2 border rounded-lg bg-white"
                                        disabled={!selectedDorm}
                                        onChange={(e) => setSelectedRoom(e.target.value)}
                                        value={selectedRoom || ''}
                                    >
                                        <option value="">Select Room</option>
                                        {rooms.map((r: any) => (
                                            <option key={r.id} value={r.id}>Room {r.roomNumber} ({r.currentHeadCount || 0}/{r.capacity})</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Bed</label>
                                    <Controller
                                        control={control}
                                        name="bedId"
                                        render={({ field }) => (
                                            <select
                                                className="w-full p-2 border rounded-lg bg-white"
                                                disabled={!selectedRoom}
                                                {...field}
                                            >
                                                <option value="">Select Bed</option>
                                                {beds.map((b: any) => (
                                                    <option key={b.id} value={b.id} disabled={b.isOccupied}>
                                                        Bed {b.bedCode} {b.isOccupied ? '(Occupied)' : '(Available)'}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    />
                                    {errors.bedId && <p className="text-red-500 text-sm mt-1">Please select a bed</p>}
                                </div>
                            </div>
                        )}

                        {type === 'EXTERNAL' && (
                            <div className="space-y-4 p-4 bg-gray-50 rounded-lg animate-in fade-in">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Address Detail</label>
                                    <textarea
                                        {...register('address')}
                                        className="w-full p-2 border rounded-lg"
                                        rows={3}
                                        placeholder="Enter full address..."
                                    />
                                    {errors.address && <p className="text-red-500 text-sm">{errors.address.message}</p>}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                Confirm Relocation
                            </button>
                        </div>
                    </form>
                </div>

                {/* History Section side panel */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <History className="w-5 h-5 text-gray-500" />
                            Accommodation History
                        </h2>

                        <div className="relative border-l-2 border-gray-200 ml-3 space-y-6">
                            {history?.map((record: any, idx: number) => (
                                <div key={record.id} className="ml-6 relative">
                                    <span className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white ${record.isCurrent ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-400">
                                            {format(new Date(record.startDate), 'MMM dd, yyyy')}
                                            {record.endDate ? ` - ${format(new Date(record.endDate), 'MMM dd, yyyy')}` : ' - Present'}
                                        </span>
                                        <span className="font-medium text-gray-800">
                                            {record.dormitoryBed
                                                ? `${record.dormitoryBed.room.dormitory.name} (Room ${record.dormitoryBed.room.roomNumber})`
                                                : record.address || 'Unknown Address'}
                                        </span>
                                        {record.dormitoryBed && (
                                            <span className="text-xs text-gray-500">Bed: {record.dormitoryBed.bedCode}</span>
                                        )}
                                        {record.isCurrent && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full w-fit">Current</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {!history?.length && <p className="text-gray-500 text-sm ml-6">No history records found.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
