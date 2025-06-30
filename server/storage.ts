import {
  users,
  campaigns,
  content,
  leads,
  activities,
  metrics,
  landingPages,
  type User,
  type Campaign,
  type Content,
  type Lead,
  type Activity,
  type Metric,
  type LandingPage,
  type UpsertUser,
  type InsertCampaign,
  type InsertContent,
  type InsertLead,
  type InsertActivity,
  type InsertLandingPage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";

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
  // User operations (required for Replit Auth)
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
      .values({
        name: campaign.name,
        productDescription: campaign.productDescription,
        marketingTone: campaign.marketingTone,
        targetPlatforms: campaign.targetPlatforms,
        budget: campaign.budget,
        goals: campaign.goals,
        status: campaign.status || 'active',
        userId: campaign.userId,
        contentFrequency: campaign.contentFrequency,
        description: campaign.description,
        strategy: campaign.strategy
      })
      .returning();
    return newCampaign;
  }

  async updateCampaign(id: number, campaignData: Partial<InsertCampaign>, userId: string): Promise<Campaign | undefined> {
    const updateData: any = {
      ...campaignData,
      updatedAt: new Date(),
    };
    
    const [campaign] = await db
      .update(campaigns)
      .set(updateData)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.userId, userId)));
    return result.count > 0;
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
      .values({
        type: contentData.type,
        body: contentData.body,
        platform: contentData.platform,
        campaignId: contentData.campaignId,
        title: contentData.title,
        metadata: contentData.metadata,
        status: contentData.status,
        scheduledAt: contentData.scheduledAt,
        publishedAt: contentData.publishedAt
      })
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
      .where(eq(content.status, "scheduled"));
  }

  // Lead operations
  async getLeads(campaignId?: number): Promise<Lead[]> {
    const query = db.select().from(leads);
    if (campaignId) {
      return await query.where(eq(leads.campaignId, campaignId));
    }
    return await query.orderBy(desc(leads.createdAt));
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values({
        source: leadData.source,
        email: leadData.email,
        metadata: leadData.metadata,
        firstName: leadData.firstName,
        lastName: leadData.lastName,
        status: leadData.status,
        campaignId: leadData.campaignId
      })
      .returning();
    return newLead;
  }

  async updateLead(id: number, leadData: Partial<InsertLead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set(leadData)
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

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values({
        type: activityData.type,
        userId: activityData.userId,
        description: activityData.description,
        metadata: activityData.metadata,
        platform: activityData.platform,
        campaignId: activityData.campaignId
      })
      .returning();
    return newActivity;
  }

  // Metrics operations
  async getMetrics(campaignId: number, platform?: string): Promise<Metric[]> {
    let query = db.select().from(metrics).where(eq(metrics.campaignId, campaignId));
    
    if (platform) {
      query = query.where(and(eq(metrics.campaignId, campaignId), eq(metrics.platform, platform)));
    }
    
    return await query.orderBy(desc(metrics.createdAt));
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
      .where(eq(landingPages.campaignId, campaignId));
  }

  async createLandingPage(landingPageData: InsertLandingPage): Promise<LandingPage> {
    const [newLandingPage] = await db
      .insert(landingPages)
      .values({
        name: landingPageData.name,
        title: landingPageData.title,
        content: landingPageData.content,
        slug: landingPageData.slug,
        campaignId: landingPageData.campaignId,
        ctaText: landingPageData.ctaText,
        formFields: landingPageData.formFields,
        subtitle: landingPageData.subtitle,
        description: landingPageData.description,
        isActive: landingPageData.isActive
      })
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
    const userCampaigns = await this.getCampaigns(userId);
    const activeCampaigns = userCampaigns.filter(c => c.status === 'active').length;
    
    // Get total leads for user campaigns
    const campaignIds = userCampaigns.map(c => c.id);
    let totalLeads = 0;
    let contentPosts = 0;
    
    for (const campaignId of campaignIds) {
      const campaignLeads = await this.getLeads(campaignId);
      const campaignContent = await this.getContent(campaignId);
      totalLeads += campaignLeads.length;
      contentPosts += campaignContent.length;
    }

    // Calculate engagement rate (simplified)
    const engagementRate = Math.random() * 15 + 5; // Mock for now
    
    return {
      activeCampaigns,
      totalLeads,
      contentPosts,
      engagementRate: Number(engagementRate.toFixed(1)),
    };
  }
}

export const storage = new DatabaseStorage();