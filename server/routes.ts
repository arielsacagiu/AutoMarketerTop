import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { campaignService } from "./services/campaignService";
import { contentService } from "./services/contentService";
import { schedulerService } from "./services/schedulerService";
import { insertCampaignSchema, insertLeadSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Start scheduler
  schedulerService.start();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = {
        activeCampaigns: 2,
        totalLeads: 47,
        contentPosts: 23,
        engagementRate: 75
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activities', async (req, res) => {
    try {
      const activities = [
        {
          id: 1,
          type: 'campaign_created',
          description: 'Created campaign "SaaS Product Launch"',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        },
        {
          id: 2,
          type: 'content_published',
          description: 'Published LinkedIn post about product features',
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
        },
        {
          id: 3,
          type: 'lead_captured',
          description: 'New lead captured from landing page',
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
        }
      ];
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Campaign routes
  app.get('/api/campaigns', async (req, res) => {
    try {
      const campaigns = [
        {
          id: 1,
          name: "SaaS Product Launch",
          status: "active",
          productDescription: "AI-powered project management tool",
          marketingTone: "professional",
          targetPlatforms: ["LinkedIn", "Twitter", "Medium"],
          strategy: {
            targetAudience: "Tech professionals and startup founders",
            valueProposition: "Streamline project management with AI insights"
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          id: 2,
          name: "E-commerce Store Promotion",
          status: "paused",
          productDescription: "Sustainable fashion marketplace",
          marketingTone: "friendly",
          targetPlatforms: ["Instagram", "TikTok", "Pinterest"],
          strategy: {
            targetAudience: "Environmentally conscious millennials",
            valueProposition: "Stylish fashion that doesn't harm the planet"
          },
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        }
      ];
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertCampaignSchema.parse(req.body);
      const campaign = await campaignService.createCampaign(campaignData, userId);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create campaign" });
      }
    }
  });

  app.get('/api/campaigns/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = parseInt(req.params.id);
      const campaignWithStats = await campaignService.getCampaignWithStats(campaignId, userId);
      
      if (!campaignWithStats) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaignWithStats);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.patch('/api/campaigns/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = parseInt(req.params.id);
      const { status } = req.body;
      
      const campaign = await campaignService.updateCampaignStatus(campaignId, status, userId);
      
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign status:", error);
      res.status(500).json({ message: "Failed to update campaign status" });
    }
  });

  app.post('/api/campaigns/:id/landing-page', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignId = parseInt(req.params.id);
      
      await campaignService.generateLandingPage(campaignId, userId);
      res.json({ message: "Landing page generated successfully" });
    } catch (error) {
      console.error("Error generating landing page:", error);
      res.status(500).json({ message: "Failed to generate landing page" });
    }
  });

  // Content routes
  app.get('/api/campaigns/:id/content', async (req, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const mockContent = [
        {
          id: 1,
          campaignId,
          platform: "LinkedIn",
          type: "post",
          title: null,
          body: "🚀 Exciting news! Our AI-powered project management tool is transforming how teams collaborate. Early users report 40% faster project completion. What's your biggest project management challenge? #ProjectManagement #AI #Productivity",
          metadata: {
            hashtags: ["#ProjectManagement", "#AI", "#Productivity"],
            cta: "Learn more about our solution"
          },
          status: "published",
          scheduledAt: null,
          publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
          id: 2,
          campaignId,
          platform: "Twitter",
          type: "post",
          title: null,
          body: "Project deadlines got you stressed? 😰 Our AI assistant predicts bottlenecks before they happen. Join 10,000+ teams working smarter, not harder. 🎯",
          metadata: {
            hashtags: ["#productivity", "#AI", "#startups"],
            cta: "Try it free"
          },
          status: "scheduled",
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
          publishedAt: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
        },
        {
          id: 3,
          campaignId,
          platform: "Medium",
          type: "article",
          title: "How AI is Revolutionizing Project Management in 2025",
          body: "The landscape of project management is rapidly evolving. With artificial intelligence at the helm, teams are discovering new ways to predict challenges, optimize workflows, and deliver exceptional results...",
          metadata: {
            cta: "Read the full article"
          },
          status: "draft",
          scheduledAt: null,
          publishedAt: null,
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
        }
      ];
      res.json(mockContent);
    } catch (error) {
      console.error("Error fetching content:", error);
      res.status(500).json({ message: "Failed to fetch content" });
    }
  });

  app.post('/api/campaigns/:id/content/generate', isAuthenticated, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const { platform, contentType } = req.body;
      
      const content = await contentService.generateContentVariations(campaignId, platform, contentType);
      res.json(content);
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  app.patch('/api/content/:id/schedule', isAuthenticated, async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const { scheduledAt } = req.body;
      
      const content = await contentService.scheduleContent(contentId, new Date(scheduledAt));
      res.json(content);
    } catch (error) {
      console.error("Error scheduling content:", error);
      res.status(500).json({ message: "Failed to schedule content" });
    }
  });

  app.post('/api/content/:id/publish', isAuthenticated, async (req: any, res) => {
    try {
      const contentId = parseInt(req.params.id);
      const content = await contentService.publishContent(contentId);
      res.json(content);
    } catch (error) {
      console.error("Error publishing content:", error);
      res.status(500).json({ message: "Failed to publish content" });
    }
  });

  app.get('/api/campaigns/:id/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const analysis = await contentService.analyzeContentPerformance(campaignId);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing performance:", error);
      res.status(500).json({ message: "Failed to analyze performance" });
    }
  });

  // Lead routes
  app.get('/api/leads', isAuthenticated, async (req: any, res) => {
    try {
      const campaignId = req.query.campaignId ? parseInt(req.query.campaignId as string) : undefined;
      const leads = await storage.getLeads(campaignId);
      res.json(leads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });

  app.post('/api/leads', async (req, res) => {
    try {
      const leadData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      console.error("Error creating lead:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create lead" });
      }
    }
  });

  // Landing page routes
  app.get('/api/landing/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const landingPage = await storage.getLandingPageBySlug(slug);
      
      if (!landingPage) {
        return res.status(404).json({ message: "Landing page not found" });
      }
      
      res.json(landingPage);
    } catch (error) {
      console.error("Error fetching landing page:", error);
      res.status(500).json({ message: "Failed to fetch landing page" });
    }
  });

  // Metrics routes
  app.get('/api/campaigns/:id/metrics', isAuthenticated, async (req: any, res) => {
    try {
      const campaignId = parseInt(req.params.id);
      const platform = req.query.platform as string;
      const metrics = await storage.getMetrics(campaignId, platform);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Scheduler routes
  app.get('/api/scheduler/status', isAuthenticated, async (req, res) => {
    try {
      const status = schedulerService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error fetching scheduler status:", error);
      res.status(500).json({ message: "Failed to fetch scheduler status" });
    }
  });

  app.post('/api/scheduler/process', isAuthenticated, async (req, res) => {
    try {
      await schedulerService.processScheduledContentNow();
      res.json({ message: "Content processing triggered successfully" });
    } catch (error) {
      console.error("Error triggering content processing:", error);
      res.status(500).json({ message: "Failed to trigger content processing" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
