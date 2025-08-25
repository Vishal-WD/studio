
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import type { MouseEventHandler } from 'react';
import { Button } from '../ui/button';
import { Download, File as FileIcon, Trash2 } from 'lucide-react';

export interface Announcement {
  id: string;
  authorName: string;
  authorId: string;
  authorDesignation?: 'dean' | 'hod';
  authorDepartment?: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
}

interface AnnouncementItemProps {
    announcement: Announcement;
    onImageClick: (imageUrl: string) => void;
    onDelete?: () => void; // Optional delete handler
}


export const AnnouncementItem = ({ announcement, onImageClick, onDelete }: AnnouncementItemProps) => {
  const getInitials = (name = '') => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };
  
  const formattedDate = announcement.createdAt ? formatDistanceToNow(new Date(announcement.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now';

  const getDesignationDisplay = () => {
    if (!announcement.authorDesignation) return null;
    const designation = announcement.authorDesignation.replace('_', ' ');
    if ((announcement.authorDesignation === 'dean' || announcement.authorDesignation === 'hod') && announcement.authorDepartment) {
      return <p className="text-xs text-foreground capitalize">{designation} of {announcement.authorDepartment}</p>;
    }
    return <p className="text-xs text-foreground capitalize">{designation}</p>;
  }

  const handleImageClick: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    if(announcement.fileUrl) {
        onImageClick(announcement.fileUrl);
    }
  }

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!announcement.fileUrl || !announcement.fileName) return;
    const link = document.createElement('a');
    link.href = announcement.fileUrl;
    link.download = announcement.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const isImage = announcement.fileType?.startsWith('image/');
  
  const handleContainerClick = () => {
    if (announcement.fileUrl && !isImage) {
        handleDownload();
    }
  }
  
  const handleDeleteClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card className="shadow-sm overflow-hidden border-2 border-primary">
        {announcement.fileUrl && isImage && (
            <div className="w-full h-64 relative bg-muted cursor-pointer border-b" onClick={handleImageClick}>
                <Image
                    src={announcement.fileUrl}
                    alt="Announcement image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
        )}
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar>
          <AvatarFallback>{getInitials(announcement.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{announcement.authorName}</p>
              {getDesignationDisplay()}
            </div>
            <div className="flex items-center gap-2">
                <p className="text-xs text-foreground">{formattedDate}</p>
                {onDelete && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-destructive" onClick={handleDeleteClick}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
                )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p className="whitespace-pre-wrap">{announcement.content}</p>
        {announcement.fileUrl && !isImage && (
            <div 
                className="mt-4 block rounded-md border bg-muted/50 p-3 hover:bg-muted transition-colors cursor-pointer"
                onClick={handleContainerClick}
                title={`Download ${announcement.fileName}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="h-6 w-6 shrink-0 text-foreground" />
                        <p className="text-sm font-medium truncate" title={announcement.fileName}>
                            {announcement.fileName}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => handleDownload(e)}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};
