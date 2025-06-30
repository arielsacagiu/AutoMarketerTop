import cron from "node-cron";
import { contentService } from "./contentService";
import { storage } from "../storage";

export class SchedulerService {
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log("Starting AutoMarketer scheduler...");

    // Check for scheduled content every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      try {
        await contentService.processScheduledContent();
      } catch (error) {
        console.error("Error processing scheduled content:", error);
      }
    });

    // Generate daily performance reports at 9 AM
    cron.schedule("0 9 * * *", async () => {
      try {
        await this.generateDailyReports();
      } catch (error) {
        console.error("Error generating daily reports:", error);
      }
    });

    // Weekly content planning on Sundays at 10 AM
    cron.schedule("0 10 * * 0", async () => {
      try {
        await this.weeklyContentPlanning();
      } catch (error) {
        console.error("Error in weekly content planning:", error);
      }
    });

    console.log("AutoMarketer scheduler started successfully");
  }

  stop() {
    this.isRunning = false;
    console.log("AutoMarketer scheduler stopped");
  }

  private async generateDailyReports() {
    console.log("Generating daily performance reports...");
    
    // This would typically:
    // 1. Fetch all active campaigns
    // 2. Generate performance summaries
    // 3. Send reports to users
    // 4. Update AI learning data
    
    // For now, we'll log the activity
    const users = await this.getAllUsers();
    
    for (const user of users) {
      const campaigns = await storage.getCampaigns(user.id);
      const activeCampaigns = campaigns.filter(c => c.status === "active");
      
      if (activeCampaigns.length > 0) {
        await storage.createActivity({
          userId: user.id,
          type: "daily_report_generated",
          description: `Daily performance report generated for ${activeCampaigns.length} active campaigns`,
          metadata: {
            activeCampaigns: activeCampaigns.length,
            reportDate: new Date().toISOString(),
          },
        });
      }
    }
  }

  private async weeklyContentPlanning() {
    console.log("Running weekly content planning...");
    
    // This would typically:
    // 1. Analyze past week's performance
    // 2. Generate new content for the upcoming week
    // 3. Schedule content based on optimal timing
    // 4. Update campaign strategies based on learnings
    
    const users = await this.getAllUsers();
    
    for (const user of users) {
      const campaigns = await storage.getCampaigns(user.id);
      const activeCampaigns = campaigns.filter(c => c.status === "active");
      
      for (const campaign of activeCampaigns) {
        // Generate weekly content plan
        const contentCount = await this.getWeeklyContentCount(campaign.contentFrequency);
        
        await storage.createActivity({
          userId: user.id,
          campaignId: campaign.id,
          type: "weekly_planning",
          description: `Weekly content planning completed for ${campaign.name}`,
          metadata: {
            plannedContent: contentCount,
            planningDate: new Date().toISOString(),
          },
        });
      }
    }
  }

  private async getAllUsers() {
    // This is a simplified implementation
    // In a real scenario, you'd have a proper user query method
    return [];
  }

  private getWeeklyContentCount(frequency: string): number {
    const frequencyMap: Record<string, number> = {
      "Daily": 7,
      "3x per week": 3,
      "Weekly": 1,
      "Bi-weekly": 0.5,
    };
    
    return frequencyMap[frequency] || 3;
  }

  // Method to manually trigger content processing (useful for testing)
  async processScheduledContentNow(): Promise<void> {
    await contentService.processScheduledContent();
  }

  // Method to get scheduler status
  getStatus(): { running: boolean; lastUpdate: Date } {
    return {
      running: this.isRunning,
      lastUpdate: new Date(),
    };
  }
}

export const schedulerService = new SchedulerService();
