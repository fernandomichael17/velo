-- Enable RLS pada tabel workspace-scoped
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Policy: user hanya bisa lihat workspace yang dia jadi member
CREATE POLICY workspace_member_access ON workspaces
  FOR ALL
  USING (
    id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- Policy: user hanya bisa lihat member dari workspace yang dia ikuti
CREATE POLICY member_access ON workspace_members
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );
