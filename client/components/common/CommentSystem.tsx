
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, Send, AtSign, User } from 'lucide-react';

interface User {
    id: string;
    username: string;
    role: string;
}

interface Mention {
    user: {
        id: string;
        username: string;
    }
}

interface Comment {
    id: string;
    content: string;
    createdAt: string;
    author: {
        id: string;
        username: string;
        role: string;
    };
    mentions: Mention[];
}

interface CommentSystemProps {
    recordId: string;
    recordTable: string;
}

export default function CommentSystem({ recordId, recordTable }: CommentSystemProps) {
    const { user: currentUser } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch Comments
    const fetchComments = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/comments/${recordTable}/${recordId}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (error) {
            console.error('Failed to fetch comments', error);
        }
    };

    // Fetch Users for Mention
    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/comments/users/search');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (recordId && recordTable) {
            fetchComments();
            fetchUsers();
        }
    }, [recordId, recordTable]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNewComment(value);

        // Detect @ mention trigger
        // Simple logic: check if last word starts with @
        const words = value.split(/\s+/);
        const lastWord = words[words.length - 1];

        if (lastWord.startsWith('@')) {
            setMentionQuery(lastWord.substring(1)); // Remove @
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const addMention = (user: User) => {
        // Replace the last @query with @Username
        const words = newComment.split(/\s+/);
        words.pop(); // remove incomplete mention
        const updatedComment = [...words, `@${user.username} `].join(' ');

        setNewComment(updatedComment);
        setSelectedMentions(prev => [...prev, user.id]);
        setShowMentions(false);

        // Refocus
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;

        try {
            const res = await fetch('http://localhost:3001/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recordId,
                    recordTableName: recordTable,
                    content: newComment,
                    mentionedUserIds: selectedMentions,
                    createdBy: currentUser.id
                })
            });

            if (res.ok) {
                setNewComment('');
                setSelectedMentions([]);
                fetchComments(); // Refresh
            }
        } catch (error) {
            console.error('Failed to post comment', error);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-50 rounded-lg border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 text-gray-800">
                    <MessageCircle size={20} className="text-blue-600" />
                    協作討論區 (Collaboration)
                </h3>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                    {comments.length} 則留言
                </span>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                {comments.length === 0 ? (
                    <p className="text-center text-gray-400 py-8">尚無討論，開始第一則留言吧！</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                                {comment.author.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-bold text-gray-900 text-sm">{comment.author.username}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-1 rounded">{comment.author.role}</span>
                                    <span className="text-xs text-gray-400 ml-auto">
                                        {new Date(comment.createdAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="mt-1 text-sm text-gray-800 break-words bg-white p-3 rounded-tr-lg rounded-br-lg rounded-bl-lg shadow-sm border border-gray-100">
                                    {comment.content}
                                </div>
                                {/* Mentions Indicator */}
                                {comment.mentions.length > 0 && (
                                    <div className="mt-1 flex gap-1">
                                        {comment.mentions.map(m => (
                                            <span key={m.user.id} className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                                                @{m.user.username}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg relative">
                {/* Mention Popover */}
                {showMentions && (
                    <div className="absolute bottom-full left-4 mb-2 w-48 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden z-10">
                        {users.filter(u => u.username.toLowerCase().includes(mentionQuery.toLowerCase())).map(user => (
                            <button
                                key={user.id}
                                onClick={() => addMention(user)}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm flex items-center gap-2"
                            >
                                <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                                    <User size={10} />
                                </div>
                                {user.username}
                            </button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <textarea
                            ref={textareaRef}
                            value={newComment}
                            onChange={handleInputChange}
                            placeholder="輸入留言... 使用 @ 標記同事"
                            className="w-full rounded-lg border-gray-300 border p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none h-10 min-h-[40px] max-h-24 py-2 pr-10"
                            rows={1}
                        />
                        <button
                            type="button"
                            className="absolute right-2 top-2 text-gray-400 hover:text-blue-600"
                            onClick={() => {
                                setNewComment(prev => prev + '@');
                                setShowMentions(true);
                                textareaRef.current?.focus();
                            }}
                        >
                            <AtSign size={16} />
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
