import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  description: text("description"),
  productDescription: text("product_description").notNull(),
  marketingTone: varchar("marketing_tone").notNull(),
  targetPlatforms: jsonb("target_platforms").$type<string[]>().notNull(),
  contentFrequency: varchar("content_frequency").notNull(),
  duration: varchar("duration").notNull(),
  status: varchar("status").notNull().default("active"), // active, paused, completed
  strategy: jsonb("strategy").$type<{
    targetAudience: string;
    valueProposition: string;
    keyMessages: string[];
    kpis: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Content table
export const content = pgTable("content", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  platform: varchar("platform").notNull(),
  type: varchar("type").notNull(), // post, blog, email, landing_page
  title: varchar("title"),
  body: text("body").notNull(),
  metadata: jsonb("metadata").$type<{
    hashtags?: string[];
    imageUrl?: string;
    link?: string;
    cta?: string;
  }>(),
  status: varchar("status").notNull().default("draft"), // draft, scheduled, published
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Leads table
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  email: varchar("email").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  source: varchar("source").notNull(), // platform or content that generated the lead
  metadata: jsonb("metadata").$type<{
    contentId?: number;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }>(),
  status: varchar("status").notNull().default("new"), // new, contacted, qualified, converted
  createdAt: timestamp("created_at").defaultNow(),
});

// Activity log table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  campaignId: integer("campaign_id").references(() => campaigns.id),
  type: varchar("type").notNull(), // content_posted, lead_captured, campaign_created, etc.
  description: text("description").notNull(),
  platform: varchar("platform"),
  metadata: jsonb("metadata").$type<{
    contentId?: number;
    leadId?: number;
    engagement?: {
      likes?: number;
      shares?: number;
      comments?: number;
      clicks?: number;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance metrics table
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  contentId: integer("content_id").references(() => content.id),
  platform: varchar("platform").notNull(),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Landing pages table
export const landingPages = pgTable("landing_pages", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  title: varchar("title").notNull(),
  subtitle: text("subtitle"),
  content: text("content").notNull(),
  ctaText: varchar("cta_text").notNull(),
  formFields: jsonb("form_fields").$type<{
    name: string;
    type: string;
    required: boolean;
    placeholder: string;
  }[]>().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  campaigns: many(campaigns),
  activities: many(activities),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  content: many(content),
  leads: many(leads),
  activities: many(activities),
  metrics: many(metrics),
  landingPages: many(landingPages),
}));

export const contentRelations = relations(content, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [content.campaignId],
    references: [campaigns.id],
  }),
  metrics: many(metrics),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [leads.campaignId],
    references: [campaigns.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [activities.campaignId],
    references: [campaigns.id],
  }),
}));

export const metricsRelations = relations(metrics, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [metrics.campaignId],
    references: [campaigns.id],
  }),
  content: one(content, {
    fields: [metrics.contentId],
    references: [content.id],
  }),
}));

export const landingPagesRelations = relations(landingPages, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [landingPages.campaignId],
    references: [campaigns.id],
  }),
}));

// Insert schemas
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentSchema = createInsertSchema(content).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertLandingPageSchema = createInsertSchema(landingPages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Content = typeof content.$inferSelect;
export type InsertContent = z.infer<typeof insertContentSchema>;
export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Metric = typeof metrics.$inferSelect;
export type LandingPage = typeof landingPages.$inferSelect;
export type InsertLandingPage = z.infer<typeof insertLandingPageSchema>;
