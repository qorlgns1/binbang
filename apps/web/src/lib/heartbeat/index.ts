// Re-export from @workspace/shared for backward compatibility
export {
  updateHeartbeat,
  startHeartbeatMonitoring,
  stopHeartbeatMonitoring,
  recordHeartbeatHistory,
  getHeartbeatHistory,
} from '@workspace/shared';
export type { HeartbeatHistoryItem } from '@workspace/shared';
