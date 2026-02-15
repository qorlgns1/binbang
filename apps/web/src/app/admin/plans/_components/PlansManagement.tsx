'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminPlanInfo } from '@/hooks/useAdminPlans';

import { PlanDialog } from './PlanDialog';
import { PlansTable } from './PlansTable';

export function PlansManagement() {
  const [editingPlan, setEditingPlan] = useState<AdminPlanInfo | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>플랜 관리</CardTitle>
              <CardDescription>요금제 플랜을 생성, 수정, 삭제합니다</CardDescription>
            </div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className='size-4 mr-2' />
              플랜 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PlansTable onEdit={setEditingPlan} />
        </CardContent>
      </Card>

      <PlanDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} plan={null} />

      <PlanDialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)} plan={editingPlan} />
    </div>
  );
}
