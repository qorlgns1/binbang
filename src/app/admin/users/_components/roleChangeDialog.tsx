'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateUserRole } from '@/hooks/useUpdateUserRole';
import type { AdminUserInfo } from '@/types/admin';

interface RoleChangeDialogProps {
  user: AdminUserInfo | null;
  onClose: () => void;
}

export function RoleChangeDialog({ user, onClose }: RoleChangeDialogProps) {
  const mutation = useUpdateUserRole();
  const newRole = user?.role === 'ADMIN' ? 'USER' : 'ADMIN';

  function handleClose() {
    mutation.reset();
    onClose();
  }

  function handleConfirm() {
    if (!user) return;
    mutation.mutate(
      { id: user.id, role: newRole },
      {
        onSuccess: () => handleClose(),
      },
    );
  }

  return (
    <Dialog
      open={!!user}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>역할 변경</DialogTitle>
          <DialogDescription>
            <span className='font-medium text-foreground'>{user?.name ?? user?.email ?? '사용자'}</span>의 역할을
            변경합니다.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className='flex items-center justify-center gap-4 py-2'>
            <div className='text-center'>
              <div className='text-xs text-muted-foreground mb-1'>현재</div>
              <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
            </div>
            <span className='text-muted-foreground'>→</span>
            <div className='text-center'>
              <div className='text-xs text-muted-foreground mb-1'>변경</div>
              <Badge variant={newRole === 'ADMIN' ? 'default' : 'secondary'}>{newRole}</Badge>
            </div>
          </div>
        )}

        {mutation.isError && (
          <p className='text-sm text-destructive'>{mutation.error?.message ?? '역할 변경에 실패했습니다'}</p>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={handleClose}
            disabled={mutation.isPending}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '변경 중...' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
