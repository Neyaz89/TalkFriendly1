"use client";

import { useState } from "react";
import { blockService } from "@/services/block.service";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldOff, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface BlockUserDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  onBlocked?: () => void;
}

export function BlockUserDialog({
  open,
  onClose,
  userId,
  userName,
  onBlocked,
}: BlockUserDialogProps) {
  const [reason, setReason] = useState("");
  const [isBlocking, setIsBlocking] = useState(false);
  const { showToast } = useToast();

  const handleBlock = async () => {
    setIsBlocking(true);

    try {
      await blockService.blockUser({
        blocked_user_id: userId,
        reason: reason.trim() || undefined,
      });

      showToast('success', `${userName} has been blocked`);
      onBlocked?.();
      handleClose();
    } catch (error: any) {
      console.error('Error blocking user:', error);
      showToast('error', error.message || 'Failed to block user');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-red-500" />
            Block {userName}?
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <p className="font-medium mb-1">When you block this user:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                  <li>They won't be able to see your posts or profile</li>
                  <li>They won't be able to message you</li>
                  <li>Any existing connection will be removed</li>
                  <li>They won't be notified that you blocked them</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Optional Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Reason (Optional, private)
            </label>
            <Textarea
              placeholder="Why are you blocking this user? (This is only visible to you)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              disabled={isBlocking}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isBlocking}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={isBlocking}
              className="flex-1"
            >
              {isBlocking ? 'Blocking...' : 'Block User'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
