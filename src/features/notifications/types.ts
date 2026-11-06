export interface Notification {
  id: string;
  translation_key: string;
  parameters: Record<string, unknown>;
  created_at: string;
  read_at: string | null;
}
