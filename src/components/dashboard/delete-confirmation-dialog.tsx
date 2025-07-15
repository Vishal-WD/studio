
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemType?: 'post' | 'event' | 'user';
  itemName?: string;
}

export function DeleteConfirmationDialog({ 
    isOpen, 
    onOpenChange, 
    onConfirm, 
    itemType = 'item',
    itemName 
}: DeleteConfirmationDialogProps) {
    const title = `Are you absolutely sure?`;
    const description = `This action cannot be undone. This will permanently delete this ${itemName ? `**${itemName}**` : `this ${itemType}`} from our servers.`;
    const cta = `Yes, delete ${itemType}`;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete {itemName ? <strong>{itemName}</strong> : `this ${itemType}`} from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90 capitalize">
            {cta}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
