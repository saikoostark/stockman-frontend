export interface AuditEvent {
  id: number;
  actor_id: number | null;
  action: string;
  target_type: string;
  target_id: string | null;
  changes: unknown;
  request_id: string;
  reason: string;
  created_at: string;
}
