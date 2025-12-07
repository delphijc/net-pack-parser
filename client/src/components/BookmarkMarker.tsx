import React from 'react';
import type { Bookmark } from '@/types/forensics';
import { Flag } from 'lucide-react';

interface BookmarkMarkerProps {
    bookmark: Bookmark;
    onClick?: (bookmark: Bookmark) => void;
}

export const BookmarkMarker: React.FC<BookmarkMarkerProps> = ({ bookmark, onClick }) => {
    return (
        <div
            className="group absolute bottom-0 transform -translate-x-1/2 cursor-pointer z-10"
            onClick={(e) => {
                e.preventDefault();
                onClick?.(bookmark);
            }}
            title={`${bookmark.label}: ${bookmark.note}`}
        >
            <div className="bg-red-500/10 p-1 rounded-full group-hover:bg-red-500/20 transition-colors">
                <Flag size={14} className="text-red-500 fill-red-500/50" />
            </div>
            <div className="h-full w-px bg-red-500/50 absolute left-1/2 top-6" style={{ height: '100px' }} />
        </div>
    );
};
