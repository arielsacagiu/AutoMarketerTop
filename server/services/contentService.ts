import { storage } from "../storage";
import { openAIService } from "./openai";
import type { Content, InsertContent } from "@shared/schema";

export class ContentService {
  async getContent(campaignId: number): Promise<Content[]> {
    return await storage.getContent(campaignId);
  }

  async scheduleContent(contentId: number, scheduledAt: Date): Promise<Content | undefined> {
    return await storage.updateContent(contentId, {
      status: "scheduled",
      scheduledAt,
    });
  }

  async publishContent(contentId: number): Promise<Content | undefined> {
    const content = await storage.updateContent(contentId, {
      status: "published",
      publishedAt: new Date(),
    });

    if (content) {
      // Create activity log
      await storage.createActivity({
        userId: "", // This should be passed from the calling function
        campaignId: content.campaignId,
        type: "content_posted",
        description: `Posted ${content.type} to ${content.platform}`,
        platform: content.platform,
        metadata: {
          contentId: content.id,
        },
      });

      // Create initial metrics entry
      await storage.createMetric({
        campaignId: content.campaignId,
        contentId: content.id,
        platform: content.platform,
        date: new Date(),
        impressions: 0,
        clicks: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        engagementRate: "0",
      });
    }

    return content;
  }

  async generateContentVariations(
    campaignId: number,
    platform: string,
    contentType: string
  ): Promise<Content[]> {
    // Get campaign details
    const campaign = await storage.getCampaign(campaignId, ""); // userId would come from auth context
    if (!campaign || !campaign.strategy) {
      throw new Error("Campaign not found or missing strategy");
    }

    const variations = await openAIService.generateContent(
      campaign.productDescription,
      campaign.strategy,
      platform,
      contentType,
      campaign.marketingTone
    );

    const createdContent: Content[] = [];

    for (const variation of variations) {
      const content = await storage.createContent({
        campaignId,
        platform,
        type: contentType,
        title: variation.title,
        body: variation.body,
        metadata: {
          hashtags: variation.hashtags,
          cta: variation.cta,
        },
        status: "draft",
      });

      createdContent.push(content);
    }

    return createdContent;
  }

  async getScheduledContent(): Promise<Content[]> {
    return await storage.getScheduledContent();
  }

  async processScheduledContent(): Promise<void> {
    const scheduledContent = await this.getScheduledContent();
    const now = new Date();

    for (const content of scheduledContent) {
      if (content.scheduledAt && content.scheduledAt <= now) {
        await this.publishContent(content.id);
      }
    }
  }

  async updateContentMetrics(
    contentId: number,
    metrics: {
      impressions?: number;
      clicks?: number;
      likes?: number;
      shares?: number;
      comments?: number;
    }
  ): Promise<void> {
    const content = await storage.updateContent(contentId, {});
    if (!content) return;

    const engagementRate = metrics.impressions && metrics.impressions > 0
      ? (((metrics.likes || 0) + (metrics.shares || 0) + (metrics.comments || 0)) / metrics.impressions * 100).toFixed(2)
      : "0";

    await storage.createMetric({
      campaignId: content.campaignId,
      contentId: content.id,
      platform: content.platform,
      date: new Date(),
      impressions: metrics.impressions || 0,
      clicks: metrics.clicks || 0,
      likes: metrics.likes || 0,
      shares: metrics.shares || 0,
      comments: metrics.comments || 0,
      engagementRate,
    });
  }

  async analyzeContentPerformance(campaignId: number): Promise<{
    insights: string[];
    recommendations: string[];
    optimizations: string[];
  }> {
    const content = await storage.getContent(campaignId);
    const metrics = await storage.getMetrics(campaignId);

    // Prepare data for AI analysis
    const contentSamples = content
      .map(c => {
        const contentMetrics = metrics.filter(m => m.contentId === c.id);
        const avgEngagement = contentMetrics.length > 0
          ? contentMetrics.reduce((sum, m) => sum + Number(m.engagementRate || 0), 0) / contentMetrics.length
          : 0;

        return {
          content: c.body,
          engagement: avgEngagement,
          platform: c.platform,
        };
      })
      .filter(sample => sample.engagement > 0) // Only include content with engagement data
      .slice(0, 10); // Limit to top 10 for analysis

    if (contentSamples.length === 0) {
      return {
        insights: ["Not enough performance data available for analysis"],
        recommendations: ["Continue posting content to gather performance data"],
        optimizations: ["Monitor engagement metrics as content gets published"],
      };
    }

    const campaign = await storage.getCampaign(campaignId, "");
    if (!campaign || !campaign.strategy) {
      throw new Error("Campaign not found or missing strategy");
    }

    return await openAIService.analyzePerformance(contentSamples, campaign.strategy);
  }
}

export const contentService = new ContentService();
