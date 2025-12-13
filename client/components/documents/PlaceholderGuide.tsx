"use client";

import React, { useState } from 'react';
import { X, Search, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagInfo {
    label: string;
    tag: string;
    desc?: string;
}

const TEMPLATE_KEYS: Record<string, TagInfo[]> = {
    "Worker Information": [
        { label: "English Name", tag: "{worker_name_en}" },
        { label: "Chinese Name", tag: "{worker_name_cn}" },
        { label: "Nationality", tag: "{worker_nationality}" },
        { label: "Gender", tag: "{worker_gender}" },
        { label: "Date of Birth", tag: "{worker_dob}" },
        { label: "Mobile Phone", tag: "{worker_mobile}" },
        { label: "Line ID", tag: "{worker_line_id}" },
        { label: "Foreign Address", tag: "{worker_address_foreign}" },
        { label: "Education Level", tag: "{worker_education}" },
        { label: "Religion", tag: "{worker_religion}" },
        { label: "Marital Status", tag: "{worker_marital_status}" },
        { label: "Height", tag: "{worker_height}" },
        { label: "Weight", tag: "{worker_weight}" },
    ],
    "ID Documents": [
        { label: "Passport Number", tag: "{passport_no}" },
        { label: "Passport Issue Date", tag: "{passport_issue_date}" },
        { label: "Passport Expiry Date", tag: "{passport_expiry_date}" },
        { label: "Passport Issue Place", tag: "{passport_issue_place}" },
        { label: "ARC Number", tag: "{arc_no}" },
        { label: "ARC Issue Date", tag: "{arc_issue_date}" },
        { label: "ARC Expiry Date", tag: "{arc_expiry_date}" },
    ],
    "Employer Information": [
        { label: "Company Name", tag: "{employer_name}" },
        { label: "Tax ID", tag: "{employer_tax_id}" },
        { label: "Phone Number", tag: "{employer_phone}" },
        { label: "Address", tag: "{employer_address}" },
        { label: "Responsible Person", tag: "{employer_rep}" },
        { label: "Factory Address", tag: "{employer_factory_address}" },
    ],
    "Agency (Taiwan)": [
        { label: "Agency Name", tag: "{agency_name}" },
        { label: "License No", tag: "{agency_license_no}" },
        { label: "Agency Tax ID", tag: "{agency_tax_id}" },
        { label: "Address", tag: "{agency_address}" },
        { label: "Phone", tag: "{agency_phone}" },
        { label: "Fax", tag: "{agency_fax}" },
        { label: "Email", tag: "{agency_email}" },
        { label: "Contact Person", tag: "{agency_rep}" },
    ],
    "Foreign Agency": [
        { label: "Name", tag: "{foreign_agency_name}" },
        { label: "Code", tag: "{foreign_agency_code}" },
        { label: "Address", tag: "{foreign_agency_address}" },
        { label: "Country", tag: "{foreign_agency_country}" },
    ],
    "Contract / Deployment": [
        { label: "Start Date", tag: "{contract_start_date}" },
        { label: "End Date", tag: "{contract_end_date}" },
        { label: "Entry Date", tag: "{entry_date}" },
        { label: "Job Type", tag: "{worker_job_type}" },
        { label: "Job Description", tag: "{job_description}" },
        { label: "Basic Salary (Num)", tag: "{basic_salary}" },
        { label: "Salary (Bilingual)", tag: "{salary_formatted}", desc: "Includes rough local currency conversion" },
    ],
    "Dormitory": [
        { label: "Dorm Name", tag: "{dorm_name}" },
        { label: "Address", tag: "{dorm_address}" },
        { label: "Landlord", tag: "{dorm_landlord}" },
        { label: "Room No", tag: "{dorm_room_no}" },
        { label: "Bed Code", tag: "{dorm_bed_code}" },
    ],
    "System / Dates": [
        { label: "Today's Date", tag: "{today}" },
        { label: "Current Year", tag: "{current_year}" },
        { label: "Current Month", tag: "{current_month}" },
        { label: "Current Day", tag: "{current_day}" },
    ],
    "Lists (Loops)": [
        { label: "Address History", tag: "{#address_history_list}...{/address_history_list}", desc: "Fields: type, address, start_date, end_date" },
        { label: "Family Members", tag: "{#family_members_list}...{/family_members_list}" },
        { label: "Emergency Contacts", tag: "{#emergency_contact_list}...{/emergency_contact_list}", desc: "Fields: name, phone" },
    ]
};

interface PlaceholderGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PlaceholderGuide({ isOpen, onClose }: PlaceholderGuideProps) {
    const [search, setSearch] = useState('');
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
    const [copiedTag, setCopiedTag] = useState<string | null>(null);

    const toggleCategory = (category: string) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const handleCopy = (tag: string) => {
        navigator.clipboard.writeText(tag);
        setCopiedTag(tag);
        setTimeout(() => setCopiedTag(null), 1500);
    };

    const filterTags = (items: TagInfo[]) => {
        if (!search) return items;
        const s = search.toLowerCase();
        return items.filter(i =>
            i.label.toLowerCase().includes(s) ||
            i.tag.toLowerCase().includes(s)
        );
    };

    // Auto-open all categories if searching
    const categories = Object.entries(TEMPLATE_KEYS).map(([category, items]) => {
        const filtered = filterTags(items);
        return { category, items: filtered };
    }).filter(g => g.items.length > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                        className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800">Template Placeholders</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                    placeholder="Search available tags..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {categories.map(({ category, items }) => {
                                const isOpen = search ? true : (openCategories[category] ?? true); // Default open

                                return (
                                    <div key={category} className="border rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleCategory(category)}
                                            className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition text-left"
                                        >
                                            <span className="font-semibold text-slate-700 text-sm">{category}</span>
                                            {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                        </button>

                                        {isOpen && (
                                            <div className="p-2 space-y-1">
                                                {items.map(item => (
                                                    <div
                                                        key={item.tag}
                                                        className="group flex items-center justify-between p-2 rounded hover:bg-blue-50 transition cursor-pointer border border-transparent hover:border-blue-100"
                                                        onClick={() => handleCopy(item.tag)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-700">{item.label}</span>
                                                            {item.desc && <span className="text-xs text-slate-400">{item.desc}</span>}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono group-hover:bg-blue-100 group-hover:text-blue-700 transition">
                                                                {item.tag}
                                                            </code>
                                                            {copiedTag === item.tag ? (
                                                                <Check size={14} className="text-green-600" />
                                                            ) : (
                                                                <Copy size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {categories.length === 0 && (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No tags matching "{search}"
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t bg-slate-50 text-xs text-slate-500 text-center">
                            Click any tag to copy to clipboard
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
