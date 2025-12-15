
"use client";

import React, { useState, useEffect } from 'react';

type EvaluationData = {
    educationDegree: string;
    avgMonthlySalary: string;
    experienceYears: string;
    qualificationDetails: string; // or boolean check
    hasQualifications: boolean;
    chineseLevel: string;
    otherLanguageDetails: string;
    hasDualLanguage: boolean;
    overseasGrowthDetails: string;
    hasOverseasGrowth: boolean;
    policyDetails: string;
    isPolicyAligned: boolean;
};

type ScoreBreakdown = {
    education: number;
    salary: number;
    experience: number;
    qualifications: number;
    chinese: number;
    otherLanguages: number;
    overseasGrowth: number;
    policy: number;
};

interface EvaluationFormProps {
    workerId: string;
    initialData?: any;
    onSave?: () => void;
}

export default function EvaluationForm({ workerId, initialData, onSave }: EvaluationFormProps) {
    const [formData, setFormData] = useState<EvaluationData>({
        educationDegree: '',
        avgMonthlySalary: '',
        experienceYears: '',
        qualificationDetails: '',
        hasQualifications: false,
        chineseLevel: '',
        otherLanguageDetails: '',
        hasDualLanguage: false,
        overseasGrowthDetails: '',
        hasOverseasGrowth: false,
        policyDetails: '',
        isPolicyAligned: false,
        ...initialData
    });

    const [scores, setScores] = useState<ScoreBreakdown>({
        education: 0,
        salary: 0,
        experience: 0,
        qualifications: 0,
        chinese: 0,
        otherLanguages: 0,
        overseasGrowth: 0,
        policy: 0
    });

    const [totalScore, setTotalScore] = useState(0);
    const [isQualified, setIsQualified] = useState(false);
    const [salaryWarning, setSalaryWarning] = useState('');

    // Real-time calculation (Simplified version of backend logic)
    useEffect(() => {
        let newScores = { ...scores };

        // 1. Education
        const edu = formData.educationDegree.toLowerCase();
        if (edu.includes('phd')) newScores.education = 30;
        else if (edu.includes('master')) newScores.education = 20;
        else if (edu.includes('bachelor')) newScores.education = 10;
        else if (edu.includes('associate')) newScores.education = 10;
        else newScores.education = 0;

        // 2. Salary
        const sal = Number(formData.avgMonthlySalary);
        if (sal >= 47971) newScores.salary = 40;
        else if (sal >= 40000) newScores.salary = 30;
        else if (sal >= 35000) newScores.salary = 20;
        else if (sal >= 31520) newScores.salary = 10;
        else newScores.salary = 0;

        if (formData.avgMonthlySalary && sal < 31520) {
            setSalaryWarning('Average monthly salary is below the minimum threshold (31,520 NTD).');
        } else {
            setSalaryWarning('');
        }

        // 3. Experience
        const exp = Number(formData.experienceYears);
        if (exp >= 2) newScores.experience = 20;
        else if (exp >= 1) newScores.experience = 10;
        else newScores.experience = 0;

        // 4. Qualifications
        newScores.qualifications = formData.hasQualifications ? 20 : 0;

        // 5. Chinese
        const chi = formData.chineseLevel.toLowerCase();
        if (chi.includes('fluent')) newScores.chinese = 30;
        else if (chi.includes('high')) newScores.chinese = 25;
        else if (chi.includes('advanced')) newScores.chinese = 20;
        else newScores.chinese = 0;

        // 6. Other Languages
        newScores.otherLanguages = formData.hasDualLanguage ? 20 : 0;

        // 7. Overseas Growth
        newScores.overseasGrowth = formData.hasOverseasGrowth ? 10 : 0;

        // 8. Policy
        newScores.policy = formData.isPolicyAligned ? 20 : 0;

        setScores(newScores);
        const total = Object.values(newScores).reduce((a, b) => a + b, 0);
        setTotalScore(total);
        setIsQualified(total >= 70);

    }, [formData]);

    const handleCalculate = async () => {
        // Call Backend API to get authoritative calculation
        try {
            const res = await fetch(`/api/workers/${workerId}/evaluation/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.breakdown) {
                setScores(data.breakdown);
                setTotalScore(data.total);
                setIsQualified(data.isQualified);
            } else if (data.error) {
                alert(data.error);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async () => {
        try {
            const res = await fetch(`/api/workers/${workerId}/evaluation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert('Evaluation saved successfully!');
                if (onSave) onSave();
            } else {
                alert('Failed to save');
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Student Evaluation (Points System)</h2>

            {/* Header: Score & Status */}
            <div className={`p-4 rounded-md mb-8 flex justify-between items-center ${isQualified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-slate-800">{totalScore} <span className="text-lg text-slate-500 font-normal">/ 190</span></div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">Total Score</span>
                        <span className={`text-sm ${isQualified ? 'text-green-600' : 'text-red-500'}`}>Passing Score: 70</span>
                    </div>
                </div>
                <div className={`px-6 py-2 rounded-full font-bold text-lg ${isQualified ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                    {isQualified ? 'QUALIFIED' : 'NOT QUALIFIED'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 1. Education */}
                <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <label className="font-semibold">1. Education</label>
                        <span className="text-blue-600 font-bold">{scores.education} pts</span>
                    </div>
                    <select
                        className="w-full border rounded p-2"
                        value={formData.educationDegree}
                        onChange={e => setFormData({ ...formData, educationDegree: e.target.value })}
                    >
                        <option value="">Select Degree...</option>
                        <option value="PhD">Doctorate (PhD) - 30</option>
                        <option value="Master">Master's Degree - 20</option>
                        <option value="Bachelor">Bachelor's Degree - 10</option>
                        <option value="Associate">Associate Degree - 10</option>
                    </select>
                </div>

                {/* 2. Salary */}
                <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <label className="font-semibold">2. Average Monthly Salary</label>
                        <span className="text-blue-600 font-bold">{scores.salary} pts</span>
                    </div>
                    <input
                        type="number"
                        className={`w-full border rounded p-2 ${salaryWarning ? 'border-red-500 bg-red-50' : ''}`}
                        value={formData.avgMonthlySalary}
                        onChange={e => setFormData({ ...formData, avgMonthlySalary: e.target.value })}
                        placeholder="NTD Amount"
                    />
                    {salaryWarning && (
                        <p className="text-red-500 text-sm mt-1">{salaryWarning}</p>
                    )}
                </div>

                {/* 3. Experience */}
                <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <label className="font-semibold">3. Experience</label>
                        <span className="text-blue-600 font-bold">{scores.experience} pts</span>
                    </div>
                    <input
                        type="number"
                        className="w-full border rounded p-2"
                        value={formData.experienceYears}
                        onChange={e => setFormData({ ...formData, experienceYears: e.target.value })}
                        placeholder="Years (incl. internship)"
                    />
                </div>

                {/* 4. Qualifications */}
                <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <label className="font-semibold">4. Qualifications</label>
                        <span className="text-blue-600 font-bold">{scores.qualifications} pts</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="hasQual"
                            checked={formData.hasQualifications}
                            onChange={e => setFormData({ ...formData, hasQualifications: e.target.checked })}
                            className="h-5 w-5"
                        />
                        <label htmlFor="hasQual">Has Special Expertise / License</label>
                    </div>
                    {formData.hasQualifications && (
                        <input
                            type="text"
                            className="w-full border rounded p-2 text-sm"
                            placeholder="Describe qualification..."
                            value={formData.qualificationDetails}
                            onChange={e => setFormData({ ...formData, qualificationDetails: e.target.value })}
                        />
                    )}
                </div>

                {/* 5. Chinese Capability */}
                <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <label className="font-semibold">5. Chinese Capability (TOCFL)</label>
                        <span className="text-blue-600 font-bold">{scores.chinese} pts</span>
                    </div>
                    <select
                        className="w-full border rounded p-2"
                        value={formData.chineseLevel}
                        onChange={e => setFormData({ ...formData, chineseLevel: e.target.value })}
                    >
                        <option value="">Select Level...</option>
                        <option value="Fluent">Fluent (Level 5-6) - 30</option>
                        <option value="High">High (Level 4) - 25</option>
                        <option value="Advanced">Advanced (Level 3) - 20</option>
                        <option value="Basic">Basic/None - 0</option>
                    </select>
                </div>

                {/* 6. Other Languages */}
                <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <label className="font-semibold">6. Other Languages</label>
                        <span className="text-blue-600 font-bold">{scores.otherLanguages} pts</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="hasLang"
                            checked={formData.hasDualLanguage}
                            onChange={e => setFormData({ ...formData, hasDualLanguage: e.target.checked })}
                            className="h-5 w-5"
                        />
                        <label htmlFor="hasLang">Has Dual Language Ability</label>
                    </div>
                </div>

                {/* 7. Overseas Growth */}
                <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <label className="font-semibold">7. Overseas Growth</label>
                        <span className="text-blue-600 font-bold">{scores.overseasGrowth} pts</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="hasGrowth"
                            checked={formData.hasOverseasGrowth}
                            onChange={e => setFormData({ ...formData, hasOverseasGrowth: e.target.checked })}
                            className="h-5 w-5"
                        />
                        <label htmlFor="hasGrowth">Resided overseas 6+ years</label>
                    </div>
                </div>

                {/* 8. Policy */}
                <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between mb-2">
                        <label className="font-semibold">8. Policy Alignment</label>
                        <span className="text-blue-600 font-bold">{scores.policy} pts</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <input
                            type="checkbox"
                            id="policy"
                            checked={formData.isPolicyAligned}
                            onChange={e => setFormData({ ...formData, isPolicyAligned: e.target.checked })}
                            className="h-5 w-5"
                        />
                        <label htmlFor="policy">Matches 5+2 Industry / New Southbound</label>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
                <button
                    onClick={handleCalculate}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-semibold"
                >
                    Verify (Server Calc)
                </button>
                <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-bold"
                >
                    Save & Submit
                </button>
            </div>
        </div>
    );
}
