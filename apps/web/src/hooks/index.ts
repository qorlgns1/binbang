/**
 * Hooks re-export layer
 * 기존 hooks의 호환성을 위해 features에서 re-export
 * TODO: 컴포넌트들이 직접 @/features에서 import하도록 마이그레이션 후 제거
 */

// Accommodations
export {
  useAccommodationQuery,
  useAccommodationQuery as useAccommodation,
  useAccommodationsQuery,
  useAccommodationsQuery as useAccommodations,
  useCheckLogsInfiniteQuery,
  useCheckLogsInfiniteQuery as useCheckLogs,
  usePriceHistoryQuery,
  usePriceHistoryQuery as usePriceHistory,
} from '@/features/accommodations/queries';

export {
  QuotaExceededError,
  useCreateAccommodationMutation,
  useCreateAccommodationMutation as useCreateAccommodation,
  useDeleteAccommodationMutation,
  useDeleteAccommodationMutation as useDeleteAccommodation,
  useToggleActiveMutation,
  useToggleActiveMutation as useToggleActive,
  useUpdateAccommodationMutation,
  useUpdateAccommodationMutation as useUpdateAccommodation,
} from '@/features/accommodations/mutations';

// User
export {
  useUserQuotaQuery,
  useUserQuotaQuery as useUserQuota,
  useUserSubscriptionQuery,
  useUserSubscriptionQuery as useUserSubscription,
} from '@/features/user/queries';

export type { UserQuotaInfo } from '@/features/user/queries';

// Logs
export { useRecentLogsQuery, useRecentLogsQuery as useRecentLogs } from '@/features/logs/queries';

// Plans
export { usePlansQuery, usePlansQuery as usePlans } from '@/features/plans/queries';

export type { PlanInfo } from '@/features/plans/queries';

// Heartbeat
export {
  useHeartbeatHistoryQuery,
  useHeartbeatHistoryQuery as useHeartbeatHistory,
  useHeartbeatStatusQuery,
  useHeartbeatStatusQuery as useHeartbeatStatus,
} from '@/features/heartbeat/queries';

export type { HeartbeatStatus } from '@/features/heartbeat/queries';

// Worker
export { useRestartWorkerMutation, useRestartWorkerMutation as useWorkerControl } from '@/features/worker/mutations';

// Admin - Users
export {
  useUserActivityInfiniteQuery,
  useUserActivityInfiniteQuery as useUserActivity,
  useUserDetailQuery,
  useUserDetailQuery as useUserDetail,
  useUsersInfiniteQuery,
  useUsersInfiniteQuery as useAdminUsers,
} from '@/features/admin/users/queries';

export {
  useUpdateUserPlanMutation,
  useUpdateUserPlanMutation as useUpdateUserPlan,
  useUpdateUserRoleMutation,
  useUpdateUserRoleMutation as useUpdateUserRole,
} from '@/features/admin/users/mutations';

// Admin - Plans
export { useAdminPlansQuery, useAdminPlansQuery as useAdminPlans } from '@/features/admin/plans/queries';

export type { AdminPlanInfo, PlanInput } from '@/features/admin/plans';

export {
  useCreatePlanMutation,
  useCreatePlanMutation as useCreatePlan,
  useDeletePlanMutation,
  useDeletePlanMutation as useDeletePlan,
  useUpdatePlanMutation,
  useUpdatePlanMutation as useUpdatePlan,
} from '@/features/admin/plans/mutations';

// Admin - Monitoring
export {
  useMonitoringLogsInfiniteQuery,
  useMonitoringLogsInfiniteQuery as useMonitoringLogs,
  useMonitoringSummaryQuery,
  useMonitoringSummaryQuery as useMonitoringSummary,
} from '@/features/admin/monitoring/queries';

// Admin - Audit Logs
export {
  useAuditLogsInfiniteQuery,
  useAuditLogsInfiniteQuery as useAdminAuditLogs,
} from '@/features/admin/audit-logs/queries';

export type { AuditLogInfo } from '@/features/admin/audit-logs/queries';

// Admin - Selectors
export {
  useSelectorHistoryQuery,
  useSelectorHistoryQuery as useSelectorHistory,
  useSelectorTestQuery,
  useSelectorTestQuery as useSelectorTest,
  useSelectorsQuery,
  useSelectorsQuery as useSelectors,
  useTestableAttributesQuery,
  useTestableAttributesQuery as useTestableAttributes,
} from '@/features/admin/selectors/queries';

export type { SelectorTestInput, SelectorTestResult, TestableElement } from '@/features/admin/selectors/queries';

export {
  useCreateSelectorMutation,
  useCreateSelectorMutation as useCreateSelector,
  useDeleteSelectorMutation,
  useDeleteSelectorMutation as useDeleteSelector,
  useInvalidateSelectorCacheMutation,
  useInvalidateSelectorCacheMutation as useInvalidateSelectorCache,
  useUpdateSelectorMutation,
  useUpdateSelectorMutation as useUpdateSelector,
  useUpdateTestableAttributesMutation,
  useUpdateTestableAttributesMutation as useUpdateTestableAttributes,
} from '@/features/admin/selectors/mutations';

export {
  useCreatePatternMutation,
  useCreatePatternMutation as useCreatePattern,
  useDeletePatternMutation,
  useDeletePatternMutation as useDeletePattern,
  usePatternsQuery,
  usePatternsQuery as usePatterns,
  useUpdatePatternMutation,
  useUpdatePatternMutation as useUpdatePattern,
} from '@/features/admin/selectors/patterns';

// Admin - Settings
export {
  useSettingsHistoryInfiniteQuery,
  useSettingsHistoryInfiniteQuery as useSettingsHistory,
  useSystemSettingsQuery,
  useSystemSettingsQuery as useSystemSettings,
} from '@/features/admin/settings/queries';

export {
  useUpdateSystemSettingsMutation,
  useUpdateSystemSettingsMutation as useUpdateSystemSettings,
} from '@/features/admin/settings/mutations';

// Admin - Throughput
export {
  useThroughputComparisonQuery,
  useThroughputComparisonQuery as useThroughputComparison,
  useThroughputHistoryQuery,
  useThroughputHistoryQuery as useThroughputHistory,
  useThroughputSummaryQuery,
  useThroughputSummaryQuery as useThroughputSummary,
} from '@/features/admin/throughput/queries';

// Utility hooks (stay in hooks folder)
export { useDebouncedValue } from './useDebouncedValue';
