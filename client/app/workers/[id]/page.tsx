import WorkerDetailClient from '../../components/workers/WorkerDetailClient';

async function getWorker(id: string) {
    const res = await fetch(`http://localhost:3001/api/workers/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
}

export default async function WorkerPage({ params }: { params: { id: string } }) {
    const worker = await getWorker(params.id);

    if (!worker) {
        return <div className="p-8">查無此移工資料 (Worker not found)</div>;
    }

    return <WorkerDetailClient worker={worker} />;
}
