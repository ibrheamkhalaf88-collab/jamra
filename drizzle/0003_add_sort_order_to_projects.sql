-- Add sortOrder column to jamra_projects for drag-and-drop reordering
ALTER TABLE `jamra_projects` ADD `sort_order` integer NOT NULL DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS jamra_projects_sort_order_idx ON jamra_projects(sort_order ASC, created_at DESC);