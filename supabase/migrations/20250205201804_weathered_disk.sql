@@ .. @@
 -- Create mockup_stats table
 CREATE TABLE mockup_stats (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
-    template_id uuid REFERENCES mockup_templates ON DELETE CASCADE,
+    mockup_template_id uuid REFERENCES mockup_templates ON DELETE CASCADE,
     views integer DEFAULT 0,
     uses integer DEFAULT 0,
     last_viewed timestamptz,
@@ .. @@
 
 -- Add indexes
-CREATE INDEX idx_mockup_stats_template_id ON mockup_stats(template_id);
+CREATE INDEX idx_mockup_stats_template_id ON mockup_stats(mockup_template_id);
 CREATE INDEX idx_mockup_stats_views ON mockup_stats(views DESC);
 CREATE INDEX idx_mockup_stats_uses ON mockup_stats(uses DESC);