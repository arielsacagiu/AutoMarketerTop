import {
  users,
  campaigns,
  content,
  leads,
  activities,
  metrics,
  landingPages,
  type User,
  type UpsertUser,
  type Campaign,
  type InsertCampaign,
  type Content,
  type InsertContent,
  type Lead,
  type InsertLead,
  type Activity,
  type InsertActivity,
  type Metric,
  type LandingPage,
  type InsertLandingPage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Campaign operations
  getCampaigns(userId: string): Promise<Campaign[]>;
  getCampaign(id: number, userId: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign & { userId: string }): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>, userId: string): Promise<Campaign | undefined>;
  deleteCampaign(id: number, userId: string): Promise<boolean>;

  // Content operations
  getContent(campaignId: number): Promise<Content[]>;
  createContent(content: InsertContent): Promise<Content>;
  updateContent(id: number, content: Partial<InsertContent>): Promise<Content | undefined>;
  getScheduledContent(): Promise<Content[]>;

  // Lead operations
  getLeads(campaignId?: number): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;

  // Activity operations
  getActivities(userId: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Metrics operations
  getMetrics(campaignId: number, platform?: string): Promise<Metric[]>;
  createMetric(metric: Omit<Metric, 'id' | 'createdAt'>): Promise<Metric>;

  // Landing page operations
  getLandingPages(campaignId: number): Promise<LandingPage[]>;
  createLandingPage(landingPage: InsertLandingPage): Promise<LandingPage>;
  getLandingPageBySlug(slug: string): Promise<LandingPage | undefined>;

  // Analytics operations
  getDashboardStats(userId: string): Promise<{
    activeCampaigns: number;
    totalLeads: number;
    contentPosts: number;
    engagementRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Campaign operations
  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: number, userId: string): Promise<Campaign | undefined> {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return campaign;
  }

  async createCampaign(campaign: InsertCampaign & { userId: string }): Promise<Campaign> {
    const [newCampaign] = await db
      .insert(campaigns)
      .values(campaign)
      .returning();
    return newCampaign;
  }

  async updateCampaign(id: number, campaign: Partial<InsertCampaign>, userId: string): Promise<Campaign | undefined> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
      .returning();
    return updatedCampaign;
  }

  async deleteCampaign(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return result.rowCount > 0;
  }

  // Content operations
  async getContent(campaignId: number): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(eq(content.campaignId, campaignId))
      .orderBy(desc(content.createdAt));
  }

  async createContent(contentData: InsertContent): Promise<Content> {
    const [newContent] = await db
      .insert(content)
      .values(contentData)
      .returning();
    return newContent;
  }

  async updateContent(id: number, contentData: Partial<InsertContent>): Promise<Content | undefined> {
    const [updatedContent] = await db
      .update(content)
      .set(contentData)
      .where(eq(content.id, id))
      .returning();
    return updatedContent;
  }

  async getScheduledContent(): Promise<Content[]> {
    return await db
      .select()
      .from(content)
      .where(
        and(
          eq(content.status, "scheduled"),
          gte(content.scheduledAt, new Date())
        )
      )
      .orderBy(content.scheduledAt);
  }

  // Lead operations
  async getLeads(campaignId?: number): Promise<Lead[]> {
    const query = db.select().from(leads);
    if (campaignId) {
      return await query
        .where(eq(leads.campaignId, campaignId))
        .orderBy(desc(leads.createdAt));
    }
    return await query.orderBy(desc(leads.createdAt));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values(lead)
      .returning();
    return newLead;
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set(lead)
      .where(eq(leads.id, id))
      .returning();
    return updatedLead;
  }

  // Activity operations
  async getActivities(userId: string, limit = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  // Metrics operations
  async getMetrics(campaignId: number, platform?: string): Promise<Metric[]> {
    const query = db
      .select()
      .from(metrics)
      .where(eq(metrics.campaignId, campaignId));
    
    if (platform) {
      return await query
        .where(and(eq(metrics.campaignId, campaignId), eq(metrics.platform, platform)))
        .orderBy(desc(metrics.date));
    }
    return await query.orderBy(desc(metrics.date));
  }

  async createMetric(metric: Omit<Metric, 'id' | 'createdAt'>): Promise<Metric> {
    const [newMetric] = await db
      .insert(metrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  // Landing page operations
  async getLandingPages(campaignId: number): Promise<LandingPage[]> {
    return await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.campaignId, campaignId))
      .orderBy(desc(landingPages.createdAt));
  }

  async createLandingPage(landingPage: InsertLandingPage): Promise<LandingPage> {
    const [newLandingPage] = await db
      .insert(landingPages)
      .values(landingPage)
      .returning();
    return newLandingPage;
  }

  async getLandingPageBySlug(slug: string): Promise<LandingPage | undefined> {
    const [landingPage] = await db
      .select()
      .from(landingPages)
      .where(eq(landingPages.slug, slug));
    return landingPage;
  }

  // Analytics operations
  async getDashboardStats(userId: string): Promise<{
    activeCampaigns: number;
    totalLeads: number;
    contentPosts: number;
    engagementRate: number;
  }> {
    // Get active campaigns count
    const [activeCampaignsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), eq(campaigns.status, "active")));

    // Get total leads count for user's campaigns
    const [totalLeadsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .innerJoin(campaigns, eq(leads.campaignId, campaigns.id))
      .where(eq(campaigns.userId, userId));

    // Get content posts count for user's campaigns
    const [contentPostsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(content)
      .innerJoin(campaigns, eq(content.campaignId, campaigns.id))
      .where(and(eq(campaigns.userId, userId), eq(content.status, "published")));

    // Calculate average engagement rate
    const [engagementResult] = await db
      .select({ 
        avgEngagement: sql<number>`AVG(CASE WHEN impressions > 0 THEN (likes + shares + comments)::decimal / impressions * 100 ELSE 0 END)` 
      })
      .from(metrics)
      .innerJoin(campaigns, eq(metrics.campaignId, campaigns.id))
      .where(eq(campaigns.userId, userId));

    return {
      activeCampaigns: activeCampaignsResult.count || 0,
      totalLeads: totalLeadsResult.count || 0,
      contentPosts: contentPostsResult.count || 0,
      engagementRate: Number(engagementResult.avgEngagement || 0),
    };
  }
}

export const storage = new DatabaseStorage();
