
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ArrowRight, X } from 'lucide-react';

interface EmployerReadinessDashboardProps {
    employerId: string;
}

export default function EmployerReadinessDashboard({ employerId }: EmployerReadinessDashboardProps) {
    const [readiness, setReadiness] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Fix Modal State
    const [fixField, setFixField] = useState<string | null>(null);
    const [fixValue, setFixValue] = useState('');

    const fetchReadiness = () => {
        setLoading(true);
        fetch(`http://localhost:3001/api/compliance/employers/${employerId}/readiness`)
            .then(res => res.json())
            .then(data => {
                setReadiness(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchReadiness();
    }, [employerId]);

    const handleFixSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fixField) return;

        // Map readable field name to DB field
        let dbField = '';
        if (fixField.includes('Tax ID')) dbField = 'taxId';
        else if (fixField.includes('Responsible Person Name')) dbField = 'responsiblePerson';
        else if (fixField.includes('Responsible Person ID')) dbField = 'responsiblePersonIdNo';
        else if (fixField.includes('Labor Insurance')) dbField = 'laborInsuranceNo';
        else if (fixField.includes('Industry Code')) dbField = 'industryCode';
        else if (fixField.includes('Factory Registration')) dbField = 'factoryRegistrationNo';
        else if (fixField.includes('Factory Address')) dbField = 'address'; // Updating main address for now

        if (!dbField) {
            alert('Unknown field mapping');
            return;
        }

        try {
            const res = await fetch(`http://localhost:3001/api/employers/${employerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [dbField]: fixValue })
            });

            if (res.ok) {
                alert('Fixed!');
                setFixField(null);
                setFixValue('');
                fetchReadiness(); // Refresh status
                window.location.reload(); // Refresh main page data too
            } else {
                alert('Update failed');
            }
        } catch (error) {
            console.error(error);
            alert('System error');
        }
    };

    if (loading) return null;
    if (!readiness) return null;

    const isReady = readiness.isReady;

    return (
        <div className={`mb-6 rounded-lg border p-4 ${isReady ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className={`p-3 rounded-full ${isReady ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {isReady ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${isReady ? 'text-green-800' : 'text-red-800'}`}>
                            {isReady ? 'Ready to Recruit (符合招募資格)' : 'Missing Info (資料缺漏 - 無法送件)'}
                        </h3>
                        <div className="mt-2 space-y-2">
                            {readiness.missingFields.map((field: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-3 text-sm text-red-700 bg-white/50 px-3 py-1 rounded">
                                    <span className="flex-1">• {field}</span>
                                    {!field.includes('3K5') && ( // 3K5 is complex, no quick fix button
                                        <button
                                            onClick={() => { setFixField(field); setFixValue(''); }}
                                            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded border border-red-200 font-bold flex items-center gap-1"
                                        >
                                            Fix It <ArrowRight size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {readiness.missingFields.length === 0 && (
                                <p className="text-green-700 text-sm">所有必要欄位皆已完整 (Tax ID, Insurance, Person ID, Factory Info).</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Fix Modal */}
            {fixField && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-[400px]">
                        <h4 className="font-bold mb-4 flex justify-between items-center">
                            <span>Update {fixField}</span>
                            <button onClick={() => setFixField(null)}><X size={18} /></button>
                        </h4>
                        <form onSubmit={handleFixSubmit}>
                            <input
                                autoFocus
                                className="w-full border p-2 rounded mb-4"
                                value={fixValue}
                                onChange={e => setFixValue(e.target.value)}
                                placeholder="Enter value..."
                            />
                            {fixField.includes('Tax ID') && <p className="text-xs text-gray-500 mb-4">Format: 8 digits</p>}
                            {fixField.includes('Person ID') && <p className="text-xs text-gray-500 mb-4">Format: 1 Letter + 9 Digits</p>}

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setFixField(null)} className="px-3 py-1 text-gray-500">Cancel</button>
                                <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
