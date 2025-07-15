
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface DeletePostDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeletePostDialog({ isOpen, onOpenChange, onConfirm }: DeletePostDialogProps) {
  return (
    <DeleteConfirmationDialog 
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        itemType="post"
    />
  )
}
