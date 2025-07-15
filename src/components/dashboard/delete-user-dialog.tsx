
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";

interface DeleteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  username: string;
}

export function DeleteUserDialog({ isOpen, onOpenChange, onConfirm, username }: DeleteUserDialogProps) {
  return (
    <DeleteConfirmationDialog 
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
        itemType="user"
        itemName={username}
    />
  )
}
