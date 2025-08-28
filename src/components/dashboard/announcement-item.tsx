
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import type { MouseEventHandler } from 'react';
import { Button } from '../ui/button';
import { Download, File as FileIcon, Trash2 } from 'lucide-react';

export interface Notice {
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

interface NoticeItemProps {
    notice: Notice;
    onImageClick: (imageUrl: string) => void;
    onDelete?: () => void; // Optional delete handler
}


export const NoticeItem = ({ notice, onImageClick, onDelete }: NoticeItemProps) => {
  const getInitials = (name = '') => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };
  
  const formattedDate = notice.createdAt ? formatDistanceToNow(new Date(notice.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now';

  const getDesignationDisplay = () => {
    if (!notice.authorDesignation) return null;
    const designation = notice.authorDesignation.replace('_', ' ');
    if ((notice.authorDesignation === 'dean' || notice.authorDesignation === 'hod') && notice.authorDepartment) {
      return <p className="text-xs text-foreground capitalize">{designation} of {notice.authorDepartment}</p>;
    }
    return <p className="text-xs text-foreground capitalize">{designation}</p>;
  }

  const handleImageClick: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    if(notice.fileUrl) {
        onImageClick(notice.fileUrl);
    }
  }

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!notice.fileUrl || !notice.fileName) return;
    const link = document.createElement('a');
    link.href = notice.fileUrl;
    link.download = notice.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const isImage = notice.fileType?.startsWith('image/');
  
  const handleContainerClick = () => {
    if (notice.fileUrl && !isImage) {
        handleDownload();
    }
  }
  
  const handleDeleteClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card className="shadow-sm overflow-hidden border-2 border-primary">
        {notice.fileUrl && isImage && (
            <div className="w-full h-64 relative bg-muted cursor-pointer border-b" onClick={handleImageClick}>
                <Image
                    src={notice.fileUrl}
                    alt="Notice image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
        )}
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar>
          <AvatarFallback>{getInitials(notice.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{notice.authorName}</p>
              {getDesignationDisplay()}
            </div>
            <div className="flex items-center gap-2">
                <p className="text-xs text-foreground">{formattedDate}</p>
                {onDelete && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:text-destructive" onClick={handleDeleteClick}>
                      <Trash2 />
                  </Button>
                )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p className="whitespace-pre-wrap">{notice.content}</p>
        {notice.fileUrl && !isImage && (
            <div 
                className="mt-4 block rounded-md border bg-muted/50 p-3 hover:bg-muted transition-colors cursor-pointer"
                onClick={handleContainerClick}
                title={`Download ${notice.fileName}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="h-6 w-6 shrink-0 text-foreground" />
                        <p className="text-sm font-medium truncate" title={notice.fileName}>
                            {notice.fileName}
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => handleDownload(e)}>
                        <Download />
                    </Button>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
};
