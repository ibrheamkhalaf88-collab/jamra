import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("jamra_projects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  summary: text("summary").notNull().default(""),
  description: text("description").notNull().default(""),
  projectUrl: text("project_url").notNull().default(""),
  coverKey: text("cover_key").notNull().default(""),
  videoUrl: text("video_url").notNull().default(""),
  galleryJson: text("gallery_json").notNull().default("[]"),
  featuresJson: text("features_json").notNull().default("[]"),
  published: integer("published").notNull().default(1),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

export const inquiries = sqliteTable("jamra_inquiries", {
  id: text("id").primaryKey(),
  accessHash: text("access_hash").notNull(),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  contactMethod: text("contact_method").notNull(),
  source: text("source").notNull(),
  goal: text("goal").notNull(),
  service: text("service").notNull(),
  status: text("status").notNull().default("new"),
  ipHash: text("ip_hash").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const inquiryMessages = sqliteTable("jamra_inquiry_messages", {
  id: text("id").primaryKey(),
  inquiryId: text("inquiry_id").notNull(),
  author: text("author").notNull(),
  body: text("body").notNull(),
  createdAt: text("created_at").notNull(),
});

export const adminLoginAttempts = sqliteTable("jamra_admin_attempts", {
  ipHash: text("ip_hash").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStarted: integer("window_started").notNull(),
});
