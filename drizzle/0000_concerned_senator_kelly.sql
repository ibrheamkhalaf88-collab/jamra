CREATE TABLE `jamra_inquiries` (
	`id` text PRIMARY KEY NOT NULL,
	`access_hash` text NOT NULL,
	`name` text NOT NULL,
	`contact` text NOT NULL,
	`contact_method` text NOT NULL,
	`source` text NOT NULL,
	`goal` text NOT NULL,
	`service` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`ip_hash` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jamra_inquiry_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`inquiry_id` text NOT NULL,
	`author` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `jamra_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`category` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`project_url` text DEFAULT '' NOT NULL,
	`cover_key` text DEFAULT '' NOT NULL,
	`video_url` text DEFAULT '' NOT NULL,
	`published` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT '' NOT NULL
);
