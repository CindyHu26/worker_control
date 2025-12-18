"use client";

import { useState, useEffect } from "react";
import { X, Save, AlertCircle, CheckCircle, Info } from "lucide-react";

interface JobOrder {
    id: string;
    employer: {
        companyName: string;
        taxId: string;
    };
    jobRequisition?: {
        skills?: string;
        salaryStructure?: string;
        leavePolicy?: string;
        workHours?: string;
        accommodation?: string;
        otherRequirements?: string;
    };
}

interface JobRequisitionFormProps {
    isOpen: boolean;
    onClose: () => void;
    jobOrder: JobOrder;
}

export default function JobRequisitionForm({
    isOpen,
    onClose,
    jobOrder,
}: JobRequisitionFormProps) {
    const [formData, setFormData] = useState({
        skills: "",
        salaryStructure: "",
        leavePolicy: "",
        workHours: "",
        accommodation: "",
        otherRequirements: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{
        type: "success" | "error";
        text: string;
    } | null>(null);

    useEffect(() => {
        if (jobOrder?.jobRequisition) {
            setFormData({
                skills: jobOrder.jobRequisition.skills || "",
                salaryStructure: jobOrder.jobRequisition.salaryStructure || "",
                leavePolicy: jobOrder.jobRequisition.leavePolicy || "",
                workHours: jobOrder.jobRequisition.workHours || "",
                accommodation: jobOrder.jobRequisition.accommodation || "",
                otherRequirements: jobOrder.jobRequisition.otherRequirements || "",
            });
        } else {
            setFormData({
                skills: "",
                salaryStructure: "",
                leavePolicy: "",
                workHours: "",
                accommodation: "",
                otherRequirements: "",
            });
        }
        setMessage(null);
    }, [jobOrder, isOpen]);

    const handleChange = (
        e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch(
                `http://localhost:3001/api/recruitment/job-orders/${jobOrder.id}/requisition`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );

            if (!response.ok) throw new Error("儲存失敗");

            setMessage({ type: "success", text: "職缺規格已成功儲存！" });
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error(error);
            setMessage({ type: "error", text: "儲存時發生錯誤，請稍後再試。" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center">
                            <Info className="w-5 h-5 mr-2" />
                            職缺規格細節 (Job Specification)
                        </h2>
                        <p className="text-indigo-100 text-sm mt-1">
                            雇主: {jobOrder.employer.companyName} ({jobOrder.employer.taxId})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            label="專業技能要求 (Skills)"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            placeholder="例如: 具備基礎機械操作經驗、需搬重物..."
                        />
                        <FormField
                            label="薪資結構說明 (Salary)"
                            name="salaryStructure"
                            value={formData.salaryStructure}
                            onChange={handleChange}
                            placeholder="例如: 基本薪資 + 生產獎金 + 加班費..."
                        />
                        <FormField
                            label="休假與加班方式 (Leave Policy)"
                            name="leavePolicy"
                            value={formData.leavePolicy}
                            onChange={handleChange}
                            placeholder="例如: 隔週休、需配合輪班及週末加班..."
                        />
                        <FormField
                            label="工作時間/排班 (Work Hours)"
                            name="workHours"
                            value={formData.workHours}
                            onChange={handleChange}
                            placeholder="例如: 日班 08:00-17:00, 需換班..."
                        />
                        <FormField
                            label="膳宿提供細節 (Accommodation)"
                            name="accommodation"
                            value={formData.accommodation}
                            onChange={handleChange}
                            placeholder="例如: 公司宿舍 (3人1間), 含三餐..."
                        />
                        <FormField
                            label="其他福利或要求 (Others)"
                            name="otherRequirements"
                            value={formData.otherRequirements}
                            onChange={handleChange}
                            placeholder="例如: 期滿交通補助、團體保險..."
                        />
                    </div>

                    {message && (
                        <div
                            className={`mt-6 p-4 rounded-xl flex items-center ${message.type === "success"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                        >
                            {message.type === "success" ? (
                                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                            )}
                            <span className="text-sm font-medium">{message.text}</span>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 transition-all"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center">
                                    <svg
                                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        ></circle>
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
                                    處理中...
                                </span>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    儲存規格
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormField({
    label,
    name,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder: string;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {label}
            </label>
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                rows={3}
                className="block w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-sm"
                placeholder={placeholder}
            />
        </div>
    );
}
