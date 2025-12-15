"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
    Briefcase,
    User,
    Phone,
    MapPin,
    Building,
    Globe,
    ArrowLeft,
    Save
} from 'lucide-react';

type LeadFormData = {
    companyName: string;
    contactPerson: string;
    status: string;
    phone: string;
    mobile: string;
    email: string;
    address: string;
    source: string;
    industry: string;
    estimatedWorkerCount: number;
};

export default function CreateLeadPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LeadFormData>({
        defaultValues: {
            status: 'NEW', // Default Status
            industry: 'MANUFACTURING', // Default Industry
            estimatedWorkerCount: 0
        }
    });

    const onSubmit = async (data: LeadFormData) => {
        setIsSubmitting(true);
        try {
            // Ensure numbers are numbers
            const payload = {
                ...data,
                estimatedWorkerCount: Number(data.estimatedWorkerCount) || 0
            };

            const res = await fetch('http://localhost:3001/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // Important for cookies/auth
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Success: Redirect to board
                router.push('/crm/board');
            } else {
                const err = await res.json();
                alert(`Error creating lead: ${err.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error(error);
            alert('Network error creating lead');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 h-[calc(100vh-64px)] overflow-y-auto max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Create New Lead</h1>
                        <p className="text-sm text-slate-500">Enter potential client details to start tracking.</p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Basic Info Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Briefcase size={20} className="text-blue-600" />
                        Company Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Company Name (Required) */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name <span className="text-red-500">*</span></label>
                            <input
                                {...register('companyName', { required: 'Company Name is required' })}
                                type="text"
                                placeholder="e.g. Acme Manufacturing Co."
                                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all ${errors.companyName ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-300'}`}
                            />
                            {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName.message}</p>}
                        </div>

                        {/* Industry */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                            <div className="relative">
                                <Building size={16} className="absolute left-3 top-3 text-slate-400" />
                                <select
                                    {...register('industry')}
                                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="MANUFACTURING">Manufacturing (製造業)</option>
                                    <option value="CONSTRUCTION">Construction (營造業)</option>
                                    <option value="INSTITUTION">Institution (機構看護)</option>
                                    <option value="HOME_CARE">Home Care (家庭看護)</option>
                                    <option value="AGRICULTURE">Agriculture (農業)</option>
                                    <option value="OTHER">Other (其他)</option>
                                </select>
                            </div>
                        </div>

                        {/* Estimated Workers */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Workers</label>
                            <input
                                {...register('estimatedWorkerCount', { min: 0 })}
                                type="number"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Source */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Lead Source</label>
                            <div className="relative">
                                <Globe size={16} className="absolute left-3 top-3 text-slate-400" />
                                <select
                                    {...register('source')}
                                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                >
                                    <option value="">Select Source...</option>
                                    <option value="Cold Call">Cold Call</option>
                                    <option value="Referral">Referral</option>
                                    <option value="Website">Website</option>
                                    <option value="Event">Event</option>
                                    <option value="Partner">Partner</option>
                                </select>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    {...register('address')}
                                    type="text"
                                    placeholder="Full company address"
                                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Info Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2 pb-2 border-b border-slate-100">
                        <User size={20} className="text-blue-600" />
                        Contact Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Contact Person */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    {...register('contactPerson')}
                                    type="text"
                                    placeholder="e.g. John Doe"
                                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="john@example.com"
                                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        {/* Mobile */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Phone</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    {...register('mobile')}
                                    type="text"
                                    placeholder="0912-345-678"
                                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Office Phone</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    {...register('phone')}
                                    type="text"
                                    placeholder="02-1234-5678"
                                    className="w-full pl-10 p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => router.push('/crm/board')}
                        className="px-6 py-2.5 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Creating...' : 'Create Lead'}
                    </button>
                </div>
            </form>
        </div>
    );
}
