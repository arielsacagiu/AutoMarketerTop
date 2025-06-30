import { storage } from "../storage";
import { openAIService } from "./openai";
import { contentService } from "./contentService";
import type { InsertCampaign, Campaign, InsertActivity } from "@shared/schema";

export class CampaignService {
  async createCampaign(campaignData: InsertCampaign, userId: string): Promise<Campaign> {
    try {
      // Generate AI strategy
      const strategy = await openAIService.generateMarketingStrategy(
        campaignData.productDescription,
        campaignData.marketingTone,
        campaignData.targetPlatforms
      );

      // Create campaign with generated strategy
      const campaign = await storage.createCampaign({
        ...campaignData,
        userId,
        strategy,
      });

      // Log activity
      await storage.createActivity({
        userId,
        campaignId: campaign.id,
        type: "campaign_created",
        description: `Created new campaign: ${campaign.name}`,
        metadata: {
          strategy: strategy,
        },
      });

      // Generate initial content
      await this.generateInitialContent(campaign, strategy);

      return campaign;
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw new Error("Failed to create campaign");
    }
  }

  private async generateInitialContent(campaign: Campaign, strategy: any) {
    try {
      for (const platform of campaign.targetPlatforms) {
        // Generate different types of content for each platform
        const contentTypes = this.getContentTypesForPlatform(platform);
        
        for (const contentType of contentTypes) {
          const variations = await openAIService.generateContent(
            campaign.productDescription,
            strategy,
            platform,
            contentType,
            campaign.marketingTone
          );

          // Create content entries
          for (const variation of variations) {
            await storage.createContent({
              campaignId: campaign.id,
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
          }
        }
      }
    } catch (error) {
      console.error("Error generating initial content:", error);
    }
  }

  private getContentTypesForPlatform(platform: string): string[] {
    const platformContentTypes: Record<string, string[]> = {
      linkedin: ["post", "article"],
      twitter: ["post", "thread"],
      reddit: ["post", "comment"],
      medium: ["article"],
      blog: ["article"],
    };

    return platformContentTypes[platform.toLowerCase()] || ["post"];
  }

  async getCampaigns(userId: string): Promise<Campaign[]> {
    return await storage.getCampaigns(userId);
  }

  async getCampaign(id: number, userId: string): Promise<Campaign | undefined> {
    return await storage.getCampaign(id, userId);
  }

  async updateCampaignStatus(
    id: number,
    status: string,
    userId: string
  ): Promise<Campaign | undefined> {
    const campaign = await storage.updateCampaign(id, { status }, userId);
    
    if (campaign) {
      await storage.createActivity({
        userId,
        campaignId: id,
        type: "campaign_status_changed",
        description: `Campaign status changed to: ${status}`,
        metadata: { newStatus: status },
      });
    }

    return campaign;
  }

  async getCampaignWithStats(id: number, userId: string): Promise<{
    campaign: Campaign;
    stats: {
      totalContent: number;
      totalLeads: number;
      avgEngagement: number;
      platformBreakdown: Record<string, number>;
    };
  } | null> {
    const campaign = await storage.getCampaign(id, userId);
    if (!campaign) return null;

    const content = await storage.getContent(id);
    const leads = await storage.getLeads(id);
    const metrics = await storage.getMetrics(id);

    // Calculate platform breakdown
    const platformBreakdown: Record<string, number> = {};
    content.forEach(c => {
      platformBreakdown[c.platform] = (platformBreakdown[c.platform] || 0) + 1;
    });

    // Calculate average engagement
    const avgEngagement = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + Number(m.engagementRate || 0), 0) / metrics.length
      : 0;

    return {
      campaign,
      stats: {
        totalContent: content.length,
        totalLeads: leads.length,
        avgEngagement,
        platformBreakdown,
      },
    };
  }

  async generateLandingPage(campaignId: number, userId: string): Promise<void> {
    const campaign = await storage.getCampaign(campaignId, userId);
    if (!campaign || !campaign.strategy) {
      throw new Error("Campaign not found or missing strategy");
    }

    const landingPageContent = await openAIService.generateLandingPageContent(
      campaign.productDescription,
      campaign.strategy,
      campaign.name
    );

    const slug = `${campaign.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

    await storage.createLandingPage({
      campaignId,
      name: `${campaign.name} Landing Page`,
      slug,
      title: landingPageContent.title,
      subtitle: landingPageContent.subtitle,
      content: landingPageContent.content,
      ctaText: landingPageContent.ctaText,
      formFields: landingPageContent.formFields,
    });

    await storage.createActivity({
      userId,
      campaignId,
      type: "landing_page_created",
      description: `Created landing page for campaign: ${campaign.name}`,
      metadata: { slug },
    });
  }
}

export const campaignService = new CampaignService();
