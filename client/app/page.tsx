import AlertFeed from '../components/dashboard/AlertFeed';
import IncidentFeed from '../components/dashboard/IncidentFeed';
import { Users, UserPlus, PlaneLanding, FileCheck } from 'lucide-react';

async function getStats() {
    // In a server component, we can fetch directly if API is internal, 
    // but usually we fetch from the running API service.
    // We need to handle the case where the server might not be running during build.
    // For demo code generation, we'll assume it runs or return mock if fail.
    try {
        const res = await fetch('http://localhost:3001/api/dashboard/stats', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    } catch (e) {
        console.error(e);
        return { totalActiveWorkers: 0, newEntriesThisMonth: 0 };
    }
}

export default async function Dashboard() {
    const stats = await getStats();

    return (
        <div className="p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">系統儀表板</h1>
                <p className="text-gray-500 mt-2">今日概況與緊急待辦事項</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">在台有效移工</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalActiveWorkers}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">本月入境人數</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.newEntriesThisMonth}</h3>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full text-green-600">
                            <PlaneLanding size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">進行中招募</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">-</h3>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-full text-purple-600">
                            <UserPlus size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">待處理文件</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">-</h3>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                            <FileCheck size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AlertFeed />
                </div>
                <div>
                    <IncidentFeed />
                </div>
            </div>
        </div>
    );
}
