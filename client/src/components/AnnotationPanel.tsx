import React, { useState } from 'react';
import { useForensicStore } from '@/store/forensicStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bookmark as BookmarkIcon, Trash2, Edit2, Save, X } from 'lucide-react';

import { useAuditLogger } from '@/hooks/useAuditLogger';

export const AnnotationPanel: React.FC = () => {
    const { bookmarks, removeBookmark, updateBookmark } = useForensicStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState('');
    const [editLabel, setEditLabel] = useState('');
    const { logAction } = useAuditLogger();

    const startEdit = (id: string, currentLabel: string, currentNote: string) => {
        setEditingId(id);
        setEditLabel(currentLabel);
        setEditNote(currentNote);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditLabel('');
        setEditNote('');
    };

    const saveEdit = (id: string) => {
        updateBookmark(id, { label: editLabel, note: editNote });
        setEditingId(null);
        logAction('ANNOTATE', `Updated bookmark: ${editLabel}`);
    };

    const handleRemove = (id: string) => {
        removeBookmark(id);
        logAction('ANNOTATE', `Removed bookmark ID: ${id}`);
    };

    if (bookmarks.length === 0) {
        return (
            <div className="p-4 text-center text-muted-foreground bg-card border rounded-md">
                <BookmarkIcon className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No bookmarks yet</p>
                <p className="text-xs">Click on the timeline to add one</p>
            </div>
        );
    }

    // Sort bookmarks by timestamp (desc)
    const sortedBookmarks = [...bookmarks].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-sm font-medium flex items-center">
                    <BookmarkIcon size={16} className="mr-2" />
                    Forensic Notes ({bookmarks.length})
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
                <div className="divide-y">
                    {sortedBookmarks.map((bookmark) => (
                        <div key={bookmark.id} className="p-3 hover:bg-muted/50 transition-colors">
                            {editingId === bookmark.id ? (
                                <div className="space-y-2">
                                    <Input
                                        value={editLabel}
                                        onChange={(e) => setEditLabel(e.target.value)}
                                        placeholder="Label"
                                        className="h-7 text-xs"
                                    />
                                    <Textarea
                                        value={editNote}
                                        onChange={(e) => setEditNote(e.target.value)}
                                        placeholder="Note content..."
                                        className="text-xs min-h-[60px]"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={cancelEdit}>
                                            <X size={14} />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-green-500" onClick={() => saveEdit(bookmark.id)}>
                                            <Save size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-semibold text-xs text-primary flex items-center gap-2">
                                            {bookmark.label}
                                            <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                                {new Date(bookmark.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(bookmark.id, bookmark.label, bookmark.note)}
                                                className="text-muted-foreground hover:text-primary p-0.5"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(bookmark.id)}
                                                className="text-muted-foreground hover:text-destructive p-0.5"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                        {bookmark.note}
                                    </p>
                                    {bookmark.author && (
                                        <div className="mt-2 text-[10px] text-muted-foreground/50">
                                            By: {bookmark.author}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};
