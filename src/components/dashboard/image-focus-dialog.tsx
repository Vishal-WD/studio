
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface ImageFocusDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    imageUrl: string | null;
}

export function ImageFocusDialog({ isOpen, onOpenChange, imageUrl }: ImageFocusDialogProps) {
    
  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    // Suggest a filename for the download
    link.download = `campus-connect-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-auto p-2 bg-transparent border-0 close-button-removed">
        <DialogHeader className="sr-only">
            <DialogTitle>Focused Image</DialogTitle>
        </DialogHeader>

        {imageUrl && (
            <div className="relative w-full h-[80vh]">
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={handleDownload}
                        aria-label="Download image"
                    >
                        <Download className="h-5 w-5"/>
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={handleClose}
                        aria-label="Close full screen"
                    >
                        <X className="h-5 w-5"/>
                    </Button>
                </div>
                <Image
                    src={imageUrl}
                    alt="Focused image"
                    fill
                    className="object-contain"
                    sizes="90vw"
                />
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
