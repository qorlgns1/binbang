/**
 * @deprecated Use '@/features/admin/plans' instead
 */
export {
  useAdminPlansQuery,
  useAdminPlansQuery as useAdminPlans,
  type AdminPlanInfo,
} from '@/features/admin/plans/queries';
export {
  useCreatePlanMutation,
  useCreatePlanMutation as useCreatePlan,
  useUpdatePlanMutation,
  useUpdatePlanMutation as useUpdatePlan,
  useDeletePlanMutation,
  useDeletePlanMutation as useDeletePlan,
  type PlanInput,
} from '@/features/admin/plans/mutations';
