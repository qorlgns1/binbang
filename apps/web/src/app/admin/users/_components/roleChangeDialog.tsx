'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

const AVAILABLE_ROLES = ['USER', 'ADMIN'] as const;

interface RoleChangeDialogProps {
  user: AdminUserInfo | null;
  onClose: () => void;
}

export function RoleChangeDialog({ user, onClose }: RoleChangeDialogProps) {
  const mutation = useUpdateUserRole();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  if (user && !initialized) {
    setSelectedRoles([...user.roles]);
    setInitialized(true);
  }

  function handleClose() {
    mutation.reset();
    setInitialized(false);
    setSelectedRoles([]);
    onClose();
  }

  function handleToggle(role: string, checked: boolean) {
    setSelectedRoles((prev) => (checked ? [...prev, role] : prev.filter((r) => r !== role)));
  }

  function handleConfirm() {
    if (!user || selectedRoles.length === 0) return;
    mutation.mutate(
      { id: user.id, roles: selectedRoles },
      {
        onSuccess: () => handleClose(),
      },
    );
  }

  const hasChanged = user
    ? JSON.stringify([...user.roles].sort()) !== JSON.stringify([...selectedRoles].sort())
    : false;

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
          <div className='space-y-3 py-2'>
            <div className='text-sm text-muted-foreground'>현재 역할</div>
            <div className='flex gap-1'>
              {user.roles.map((role) => (
                <Badge
                  key={role}
                  variant={role === 'ADMIN' ? 'default' : 'secondary'}
                >
                  {role}
                </Badge>
              ))}
            </div>
            <div className='text-sm text-muted-foreground pt-2'>변경할 역할</div>
            <div className='space-y-2'>
              {AVAILABLE_ROLES.map((role) => (
                <label
                  key={role}
                  className='flex items-center gap-2 cursor-pointer'
                >
                  <Checkbox
                    checked={selectedRoles.includes(role)}
                    onCheckedChange={(checked) => handleToggle(role, !!checked)}
                  />
                  <span className='text-sm'>{role}</span>
                </label>
              ))}
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
            disabled={mutation.isPending || selectedRoles.length === 0 || !hasChanged}
          >
            {mutation.isPending ? '변경 중...' : '확인'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
