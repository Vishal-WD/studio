
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import type { MouseEventHandler } from 'react';
import { Button } from '../ui/button';
import { Download, File as FileIcon, Trash2 } from 'lucide-react';

export interface Post {
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

interface PostItemProps {
    post: Post;
    onImageClick: (imageUrl: string) => void;
    onDelete?: () => void; // Optional delete handler
}


export const PostItem = ({ post, onImageClick, onDelete }: PostItemProps) => {
  const getInitials = (name = '') => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };
  
  const formattedDate = post.createdAt ? formatDistanceToNow(new Date(post.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now';

  const getDesignationDisplay = () => {
    if (!post.authorDesignation) return null;
    const designation = post.authorDesignation.replace('_', ' ');
    if ((post.authorDesignation === 'dean' || post.authorDesignation === 'hod') && post.authorDepartment) {
      return <p className="text-xs text-muted-foreground capitalize">{designation} of {post.authorDepartment}</p>;
    }
    return <p className="text-xs text-muted-foreground capitalize">{designation}</p>;
  }

  const handleImageClick: MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    if(post.fileUrl) {
        onImageClick(post.fileUrl);
    }
  }

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!post.fileUrl || !post.fileName) return;
    const link = document.createElement('a');
    link.href = post.fileUrl;
    link.download = post.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const isImage = post.fileType?.startsWith('image/');
  
  const handleContainerClick = () => {
    if (post.fileUrl && !isImage) {
        handleDownload();
    }
  }
  
  const handleDeleteClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Card className="shadow-sm overflow-hidden">
        {post.fileUrl && isImage && (
            <div className="w-full h-64 relative bg-muted cursor-pointer" onClick={handleImageClick}>
                <Image
                    src={post.fileUrl}
                    alt="Post image"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
        )}
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
        <Avatar>
          <AvatarFallback>{getInitials(post.authorName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold">{post.authorName}</p>
              {getDesignationDisplay()}
            </div>
            <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">{formattedDate}</p>
                {onDelete && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleDeleteClick}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
                )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.fileUrl && !isImage && (
            <div 
                className="mt-4 block rounded-md border bg-muted/50 p-3 hover:bg-muted transition-colors cursor-pointer"
                onClick={handleContainerClick}
                title={`Download ${post.fileName}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <FileIcon className="h-6 w-6 shrink-0 text-muted-foreground" />
                        <p className="text-sm font-medium truncate" title={post.fileName}>
                            {post.fileName}
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
