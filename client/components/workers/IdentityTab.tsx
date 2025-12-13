import { useState, useEffect } from 'react';
import { User, Save, X, Phone, MapPin, Calendar, CreditCard, Droplet, Ruler } from 'lucide-react';

interface IdentityTabProps {
    worker: any;
    onUpdate: (data: any) => Promise<void>;
}

export default function IdentityTab({ worker, onUpdate }: IdentityTabProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...worker });
    const [isLoading, setIsLoading] = useState(false);

    // Sync if worker prop changes (e.g. after external refresh)
    useEffect(() => {
        setFormData({ ...worker });
    }, [worker]);

    // Helpers
    const calculateAge = (dob: string) => {
        if (!dob) return '-';
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            await onUpdate(formData);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            alert('更新失敗');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                    <User className="text-blue-600" /> 基本資料 (Identity)
                </h3>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setFormData({ ...worker }); // Reset
                                }}
                                className="px-4 py-2 rounded border border-slate-300 text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                disabled={isLoading}
                            >
                                <X size={16} /> 取消
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 font-bold shadow-sm"
                                disabled={isLoading}
                            >
                                <Save size={16} /> 儲存變更
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 rounded bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium shadow-sm transition"
                        >
                            編輯資料 (Edit)
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Personal Info */}
                <div className="space-y-6">
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-sm border-b pb-2">個人資訊</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">英文姓名 (English Name)</label>
                            {isEditing ? (
                                <input
                                    name="englishName"
                                    value={formData.englishName || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-lg font-bold text-slate-800">{worker.englishName}</p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">中文姓名 (Chinese Name)</label>
                            {isEditing ? (
                                <input
                                    name="chineseName"
                                    value={formData.chineseName || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-lg font-medium text-slate-800">{worker.chineseName || '-'}</p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">國籍 (Nationality)</label>
                            {isEditing ? (
                                <select
                                    name="nationality"
                                    value={formData.nationality}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="ID">印尼 (Indonesia)</option>
                                    <option value="VN">越南 (Vietnam)</option>
                                    <option value="PH">菲律賓 (Philippines)</option>
                                    <option value="TH">泰國 (Thailand)</option>
                                </select>
                            ) : (
                                <p className="text-base text-slate-800">{worker.nationality}</p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">性別 (Gender)</label>
                            {isEditing ? (
                                <select
                                    name="gender"
                                    value={formData.gender || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">未選擇</option>
                                    <option value="male">男 (Male)</option>
                                    <option value="female">女 (Female)</option>
                                </select>
                            ) : (
                                <p className="text-base text-slate-800">
                                    {worker.gender === 'male' ? '男 (Male)' : worker.gender === 'female' ? '女 (Female)' : '-'}
                                </p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">出生日期 (Date of Birth)</label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    name="dob"
                                    value={formData.dob ? new Date(formData.dob).toISOString().split('T')[0] : ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800 flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    {new Date(worker.dob).toLocaleDateString()}
                                    <span className="text-slate-400 text-sm">({calculateAge(worker.dob)} yrs in Taiwan?? No, Age: {calculateAge(worker.dob)})</span>
                                </p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">移工年齡 (Age)</label>
                            <p className="text-base text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 inline-block">
                                {calculateAge(formData.dob)} 歲
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">母國身分證 (ID No.)</label>
                            {isEditing ? (
                                <input
                                    name="homeCountryId"
                                    value={formData.homeCountryId || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800 font-mono">{worker.homeCountryId || '-'}</p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">稅籍編號 (Tax ID)</label>
                            {isEditing ? (
                                <input
                                    name="taxId"
                                    value={formData.taxId || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="格式: 12345678"
                                />
                            ) : (
                                <p className="text-base text-slate-800 font-mono">{worker.taxId || '-'}</p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">宗教 (Religion)</label>
                            {isEditing ? (
                                <input
                                    name="religion"
                                    value={formData.religion || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800">{worker.religion || '-'}</p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">血型 (Blood Type)</label>
                            {isEditing ? (
                                <select
                                    name="bloodType"
                                    value={formData.bloodType || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">-</option>
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="O">O</option>
                                    <option value="AB">AB</option>
                                </select>
                            ) : (
                                <p className="text-base text-slate-800 flex items-center gap-2">
                                    <Droplet size={14} className="text-red-400" /> {worker.bloodType || '-'}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 bg-slate-50 p-4 rounded border border-slate-100">
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">身高 (Height cm)</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    name="height"
                                    step="0.1"
                                    value={formData.height || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800 flex items-center gap-2">
                                    <Ruler size={14} className="text-slate-400" /> {worker.height || '-'} cm
                                </p>
                            )}
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">體重 (Weight kg)</label>
                            {isEditing ? (
                                <input
                                    type="number"
                                    name="weight"
                                    step="0.1"
                                    value={formData.weight || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800 flex items-center gap-2">
                                    <Ruler size={14} className="text-slate-400" /> {worker.weight || '-'} kg
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Additional Info: Marital, Education, BirthPlace */}
                    <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4 border-slate-100">
                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">婚姻狀況 (Marital Status)</label>
                            {isEditing ? (
                                <select
                                    name="maritalStatus"
                                    value={formData.maritalStatus || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">未選擇</option>
                                    <option value="single">未婚 (Single)</option>
                                    <option value="married">已婚 (Married)</option>
                                    <option value="divorced">離婚 (Divorced)</option>
                                    <option value="widowed">喪偶 (Widowed)</option>
                                </select>
                            ) : (
                                <p className="text-base text-slate-800">
                                    {formData.maritalStatus === 'single' ? '未婚' :
                                        formData.maritalStatus === 'married' ? '已婚' :
                                            formData.maritalStatus === 'divorced' ? '離婚' :
                                                formData.maritalStatus === 'widowed' ? '喪偶' : formData.maritalStatus || '-'}
                                </p>
                            )}
                        </div>

                        {/* Spouse Name & Marriage Date - Show if Married */}
                        {((isEditing && formData.maritalStatus === 'married') || (!isEditing && formData.maritalStatus === 'married')) && (
                            <>
                                <div className="col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">配偶姓名 (Spouse Name)</label>
                                    {isEditing ? (
                                        <input
                                            name="spouseName"
                                            value={formData.spouseName || ''}
                                            onChange={handleChange}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    ) : (
                                        <p className="text-base text-slate-800">{formData.spouseName || '-'}</p>
                                    )}
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">結婚日期 (Marriage Date)</label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            name="marriageDate"
                                            value={formData.marriageDate ? new Date(formData.marriageDate).toISOString().split('T')[0] : ''}
                                            onChange={handleChange}
                                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    ) : (
                                        <p className="text-base text-slate-800">
                                            {formData.marriageDate ? new Date(formData.marriageDate).toLocaleDateString() : '-'}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Divorce Date - Show if Divorced */}
                        {((isEditing && formData.maritalStatus === 'divorced') || (!isEditing && formData.maritalStatus === 'divorced')) && (
                            <div className="col-span-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">離婚日期 (Divorce Date)</label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        name="divorceDate"
                                        value={formData.divorceDate ? new Date(formData.divorceDate).toISOString().split('T')[0] : ''}
                                        onChange={handleChange}
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                ) : (
                                    <p className="text-base text-slate-800">
                                        {formData.divorceDate ? new Date(formData.divorceDate).toLocaleDateString() : '-'}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">教育程度 (Education)</label>
                            {isEditing ? (
                                <select
                                    name="educationLevel"
                                    value={formData.educationLevel || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="">未選擇</option>
                                    <option value="elementary">國小 (Elementary)</option>
                                    <option value="junior_high">國中 (Junior High)</option>
                                    <option value="senior_high">高中 (Senior High)</option>
                                    <option value="college">大學 (College/University)</option>
                                    <option value="other">其他 (Other)</option>
                                </select>
                            ) : (
                                <p className="text-base text-slate-800">{formData.educationLevel || '-'}</p>
                            )}
                        </div>

                        <div className="col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">出生地點 (Birth Place)</label>
                            {isEditing ? (
                                <input
                                    name="birthPlace"
                                    value={formData.birthPlace || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800">{formData.birthPlace || '-'}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Contact & Address */}
                <div className="space-y-6">
                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-sm border-b pb-2">聯絡方式 (Contact)</h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">手機 (Mobile Phone)</label>
                            {isEditing ? (
                                <input
                                    name="mobilePhone"
                                    value={formData.mobilePhone || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-lg font-medium text-slate-800 flex items-center gap-2">
                                    <Phone size={16} className="text-green-600" /> {worker.mobilePhone || '-'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Line ID</label>
                            {isEditing ? (
                                <input
                                    name="lineId"
                                    value={formData.lineId || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800 flex items-center gap-2">
                                    <span className="bg-green-100 text-green-700 text-[10px] px-1 rounded font-bold">LINE</span> {worker.lineId || '-'}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">海外緊急聯絡電話 (Overseas Phone)</label>
                            {isEditing ? (
                                <input
                                    name="overseasContactPhone"
                                    value={formData.overseasContactPhone || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800 font-mono">{formData.overseasContactPhone || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">海外家屬聯絡人 (Overseas Family Contact)</label>
                            {isEditing ? (
                                <input
                                    name="overseasFamilyContact"
                                    value={formData.overseasFamilyContact || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800">{formData.overseasFamilyContact || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">台灣緊急聯絡人 (Taiwan Emergency Contact)</label>
                            {isEditing ? (
                                <input
                                    name="emergencyContactPhone"
                                    value={formData.emergencyContactPhone || ''}
                                    onChange={handleChange}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="姓名與電話 (Name & Phone)"
                                />
                            ) : (
                                <p className="text-base text-slate-800">{formData.emergencyContactPhone || '-'}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">國外地址 (Foreign Address)</label>
                            {isEditing ? (
                                <textarea
                                    name="foreignAddress"
                                    value={formData.foreignAddress || ''}
                                    onChange={(e: any) => handleChange(e)}
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                                />
                            ) : (
                                <p className="text-base text-slate-800 flex items-start gap-2">
                                    <MapPin size={16} className="text-red-500 mt-1 shrink-0" /> {formData.foreignAddress || '-'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
