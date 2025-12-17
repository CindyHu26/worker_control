
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Send, FileText, Plus } from 'lucide-react';

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author?: {
        username: string;
    };
}

interface AbnormalTrackingLogProps {
    checkId: string;
    comments: Comment[];
    onAddComment: (content: string) => Promise<void>;
}

const AbnormalTrackingLog: React.FC<AbnormalTrackingLogProps> = ({ checkId, comments, onAddComment }) => {
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setSubmitting(true);
        try {
            await onAddComment(newComment);
            setNewComment('');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50 rounded-xl p-6 mt-6 border border-slate-200">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileText size={20} className="text-slate-500" />
                    個案備註與追蹤歷程
                </h3>
                {/* <button className="bg-slate-800 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 hover:bg-slate-900 transition">
                    <Plus size={16} /> 新增紀錄
                </button> */}
            </div>

            <div className="space-y-6 max-h-[300px] overflow-y-auto pr-2 relative">
                {/* Thread Line */}
                {comments.length > 0 && (
                    <div className="absolute top-4 bottom-4 left-[27px] w-0.5 bg-slate-200 -z-0"></div>
                )}

                {comments.length === 0 ? (
                    <div className="text-center text-slate-400 py-4 text-sm">尚無追蹤紀錄</div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="relative pl-14 group">
                            <div className="absolute left-[18px] top-1 w-5 h-5 bg-white border-2 border-slate-300 rounded-full z-10 flex items-center justify-center">
                                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                            </div>

                            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-slate-700 text-sm">
                                        {comment.author?.username || 'System'}
                                    </span>
                                    <span className="text-xs text-slate-400 font-mono">
                                        {format(new Date(comment.createdAt), 'yyyy/MM/dd HH:mm')}
                                    </span>
                                </div>
                                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="輸入追蹤進度 (e.g. 已通知雇主帶移工至宏恩醫院複檢)..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
};

export default AbnormalTrackingLog;
