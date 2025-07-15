
'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import Image from 'next/image';

interface ImageFocusDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    imageUrl: string | null;
}

export function ImageFocusDialog({ isOpen, onOpenChange, imageUrl }: ImageFocusDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-auto p-2 bg-transparent border-0">
        {imageUrl && (
            <div className="relative w-full h-[80vh]">
                <Image
                    src={imageUrl}
                    alt="Focused image"
                    fill
                    className="object-contain"
                />
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
