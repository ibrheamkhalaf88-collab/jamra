CREATE TABLE `jamra_admin_attempts` (
	`ip_hash` text PRIMARY KEY NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`window_started` integer NOT NULL
);
