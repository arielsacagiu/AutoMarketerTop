import { storage } from "../storage";
import { openAIService } from "./openai";
import { contentService } from "./contentService";
import { campaignService } from "./campaignService";
import cron from "node-cron";

interface FeedbackWindow {
  platform: string;
  initialWait: number; // minutes
  sweepPattern: number[]; // minutes between sweeps
  mutationWindow: number; // hours
}

interface PerformanceMetrics {
  contentId: number;
  platform: string;
  timestamp: Date;
  views: number;
  clicks: number;
  engagement: number;
  conversions: number;
  performance: 'performing' | 'neutral' | 'underperforming';
}

interface AutonomousState {
  campaignId: number;
  phase: 'initializing' | 'strategy' | 'content_gen' | 'validation' | 'distribution' | 'feedback' | 'learning' | 'continuous';
  lastMutation: Date;
  performanceData: PerformanceMetrics[];
  learningBank: any[];
}

export class AutonomousMarketingEngine {
  private states: Map<number, AutonomousState> = new Map();
  private feedbackWindows: FeedbackWindow[] = [
    {
      platform: 'social',
      initialWait: 45,
      sweepPattern: [120, 120, 120, 1440], // 2h, 2h, 2h, 24h, then daily
      mutationWindow: 24
    },
    {
      platform: 'blog',
      initialWait: 120,
      sweepPattern: [360, 1440], // 6h, 24h, then daily
      mutationWindow: 24
    },
    {
      platform: 'forum',
      initialWait: 60,
      sweepPattern: [360, 1440], // 6h, 24h, daily
      mutationWindow: 24
    },
    {
      platform: 'email',
      initialWait: 120,
      sweepPattern: [720, 1440], // 12h, 24h, daily
      mutationWindow: 24
    }
  ];

  constructor() {
    this.startEngine();
  }

  // Phase 1: Campaign Initialization
  async initializeCampaign(campaignId: number, productDescription: string, userId: string): Promise<void> {
    console.log(`[AutonomousEngine] Initializing campaign ${campaignId}`);
    
    const state: AutonomousState = {
      campaignId,
      phase: 'initializing',
      lastMutation: new Date(),
      performanceData: [],
      learningBank: []
    };
    
    this.states.set(campaignId, state);
    
    // Log activity
    await storage.createActivity({
      userId,
      type: 'campaign_initialized',
      description: `Autonomous engine initialized for campaign ${campaignId}`,
      campaignId,
      metadata: { phase: 'initializing' }
    });

    // Immediately trigger strategy generation
    setTimeout(() => this.generateStrategy(campaignId, productDescription, userId), 1000);
  }

  // Phase 2: Strategy Generation (<1 minute)
  private async generateStrategy(campaignId: number, productDescription: string, userId: string): Promise<void> {
    const state = this.states.get(campaignId);
    if (!state) return;

    console.log(`[AutonomousEngine] Generating strategy for campaign ${campaignId}`);
    state.phase = 'strategy';

    try {
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) return;

      const strategy = await openAIService.generateMarketingStrategy(
        productDescription,
        campaign.marketingTone || 'professional',
        campaign.targetPlatforms || ['LinkedIn', 'Twitter']
      );

      // Update campaign with strategy
      await storage.updateCampaign(campaignId, { strategy }, userId);

      await storage.createActivity({
        userId,
        type: 'strategy_generated',
        description: `AI generated marketing strategy with ${strategy.keyMessages.length} key messages`,
        campaignId,
        metadata: { targetAudience: strategy.targetAudience }
      });

      // Trigger content generation
      setTimeout(() => this.generateContent(campaignId, strategy, userId), 2000);
    } catch (error) {
      console.error(`[AutonomousEngine] Strategy generation failed:`, error);
    }
  }

  // Phase 3: Content Generation (1-3 minutes, parallelizable)
  private async generateContent(campaignId: number, strategy: any, userId: string): Promise<void> {
    const state = this.states.get(campaignId);
    if (!state) return;

    console.log(`[AutonomousEngine] Generating content for campaign ${campaignId}`);
    state.phase = 'content_gen';

    try {
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) return;

      const platforms = campaign.targetPlatforms || ['LinkedIn', 'Twitter'];
      const contentTypes = ['post', 'article'];

      // Generate content for each platform/type combination
      for (const platform of platforms) {
        for (const contentType of contentTypes) {
          try {
            const variations = await openAIService.generateContent(
              campaign.productDescription,
              strategy,
              platform,
              contentType,
              campaign.marketingTone || 'professional'
            );

            // Create content entries
            for (const variation of variations) {
              await storage.createContent({
                campaignId,
                platform: variation.platform,
                type: variation.type,
                title: variation.title,
                body: variation.body,
                metadata: {
                  hashtags: variation.hashtags,
                  cta: variation.cta
                },
                status: 'draft'
              });
            }
          } catch (error) {
            console.error(`[AutonomousEngine] Content generation failed for ${platform}/${contentType}:`, error);
          }
        }
      }

      await storage.createActivity({
        userId,
        type: 'content_generated',
        description: `AI generated content for ${platforms.length} platforms`,
        campaignId,
        metadata: { platforms }
      });

      // Move to distribution phase
      setTimeout(() => this.startDistribution(campaignId, userId), 3000);
    } catch (error) {
      console.error(`[AutonomousEngine] Content generation failed:`, error);
    }
  }

  // Phase 5: Autonomous Distribution (0-90 min, staggered)
  private async startDistribution(campaignId: number, userId: string): Promise<void> {
    const state = this.states.get(campaignId);
    if (!state) return;

    console.log(`[AutonomousEngine] Starting distribution for campaign ${campaignId}`);
    state.phase = 'distribution';

    try {
      const content = await storage.getContent(campaignId);
      const draftContent = content.filter(c => c.status === 'draft');

      // Schedule content with platform-specific timing
      for (const item of draftContent) {
        const delay = this.calculateDistributionDelay(item.platform);
        const scheduledAt = new Date(Date.now() + delay);

        await storage.updateContent(item.id, {
          status: 'scheduled',
          scheduledAt
        });

        // Schedule actual publication
        setTimeout(() => this.publishContent(item.id, campaignId, userId), delay);
      }

      await storage.createActivity({
        userId,
        type: 'distribution_scheduled',
        description: `Scheduled ${draftContent.length} content pieces for autonomous distribution`,
        campaignId,
        metadata: { contentCount: draftContent.length }
      });

    } catch (error) {
      console.error(`[AutonomousEngine] Distribution scheduling failed:`, error);
    }
  }

  private calculateDistributionDelay(platform: string): number {
    const baseDelay = {
      'LinkedIn': 15 * 60 * 1000, // 15 minutes
      'Twitter': 30 * 60 * 1000,  // 30 minutes
      'Medium': 45 * 60 * 1000,   // 45 minutes
      'Instagram': 20 * 60 * 1000, // 20 minutes
      'TikTok': 25 * 60 * 1000,   // 25 minutes
      'Pinterest': 35 * 60 * 1000  // 35 minutes
    };

    const delay = baseDelay[platform] || 30 * 60 * 1000;
    // Add randomization (±50%)
    const randomFactor = 0.5 + Math.random();
    return Math.floor(delay * randomFactor);
  }

  private async publishContent(contentId: number, campaignId: number, userId: string): Promise<void> {
    try {
      const content = await storage.updateContent(contentId, {
        status: 'published',
        publishedAt: new Date()
      });

      if (content) {
        await storage.createActivity({
          userId,
          type: 'content_published',
          description: `Published ${content.type} on ${content.platform}`,
          campaignId,
          metadata: { contentId, platform: content.platform }
        });

        // Schedule feedback collection based on platform
        this.scheduleFeedbackCollection(contentId, content.platform, campaignId, userId);
      }
    } catch (error) {
      console.error(`[AutonomousEngine] Publishing failed for content ${contentId}:`, error);
    }
  }

  // Phase 6-7: Cooldown & Multi-Sweep Feedback Cycle
  private scheduleFeedbackCollection(contentId: number, platform: string, campaignId: number, userId: string): void {
    const platformType = this.mapPlatformToType(platform);
    const feedbackWindow = this.feedbackWindows.find(fw => fw.platform === platformType);
    
    if (!feedbackWindow) return;

    // Schedule initial feedback collection after cooldown
    setTimeout(() => {
      this.collectFeedback(contentId, platform, campaignId, userId, 0);
    }, feedbackWindow.initialWait * 60 * 1000);
  }

  private async collectFeedback(contentId: number, platform: string, campaignId: number, userId: string, sweepIndex: number): Promise<void> {
    try {
      console.log(`[AutonomousEngine] Collecting feedback for content ${contentId} (sweep ${sweepIndex})`);

      // Simulate metrics collection (replace with real API calls)
      const metrics = await this.simulateMetricsCollection(contentId, platform);
      
      const state = this.states.get(campaignId);
      if (state) {
        state.performanceData.push(metrics);
      }

      // Store metrics
      await storage.createMetric({
        contentId,
        platform,
        campaignId,
        views: metrics.views,
        clicks: metrics.clicks,
        engagement: metrics.engagement,
        conversions: metrics.conversions
      });

      await storage.createActivity({
        userId,
        type: 'metrics_collected',
        description: `Collected performance metrics: ${metrics.views} views, ${metrics.clicks} clicks`,
        campaignId,
        metadata: { contentId, performance: metrics.performance }
      });

      // Schedule next sweep if applicable
      const platformType = this.mapPlatformToType(platform);
      const feedbackWindow = this.feedbackWindows.find(fw => fw.platform === platformType);
      
      if (feedbackWindow && sweepIndex < feedbackWindow.sweepPattern.length) {
        const nextDelay = feedbackWindow.sweepPattern[sweepIndex] * 60 * 1000;
        setTimeout(() => {
          this.collectFeedback(contentId, platform, campaignId, userId, sweepIndex + 1);
        }, nextDelay);
      }

      // Trigger learning if enough data collected
      if (sweepIndex >= 2) {
        this.triggerLearningCycle(campaignId, userId);
      }

    } catch (error) {
      console.error(`[AutonomousEngine] Feedback collection failed:`, error);
    }
  }

  // Phase 8: Adaptive AI Brain - Learning Loop
  private async triggerLearningCycle(campaignId: number, userId: string): Promise<void> {
    const state = this.states.get(campaignId);
    if (!state) return;

    const hoursSinceLastMutation = (Date.now() - state.lastMutation.getTime()) / (1000 * 60 * 60);
    
    // Only mutate if 24h passed or significant performance deviation detected
    if (hoursSinceLastMutation < 24 && !this.detectSignificantDeviation(state.performanceData)) {
      return;
    }

    console.log(`[AutonomousEngine] Starting learning cycle for campaign ${campaignId}`);
    state.phase = 'learning';
    state.lastMutation = new Date();

    try {
      // Analyze performance patterns
      const insights = this.analyzePerformancePatterns(state.performanceData);
      
      // Update learning bank
      state.learningBank.push({
        timestamp: new Date(),
        insights,
        performanceSnapshot: [...state.performanceData]
      });

      // Generate optimized content based on learnings
      await this.generateOptimizedContent(campaignId, insights, userId);

      await storage.createActivity({
        userId,
        type: 'learning_cycle_completed',
        description: `AI completed learning cycle, optimized content strategy`,
        campaignId,
        metadata: { insights: insights.topPerformers }
      });

      // Move to continuous operation
      state.phase = 'continuous';

    } catch (error) {
      console.error(`[AutonomousEngine] Learning cycle failed:`, error);
    }
  }

  private detectSignificantDeviation(metrics: PerformanceMetrics[]): boolean {
    if (metrics.length < 5) return false;

    const recent = metrics.slice(-3);
    const earlier = metrics.slice(-6, -3);

    const recentAvg = recent.reduce((sum, m) => sum + m.engagement, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, m) => sum + m.engagement, 0) / earlier.length;

    // Detect 50%+ change in engagement
    return Math.abs(recentAvg - earlierAvg) / earlierAvg > 0.5;
  }

  private analyzePerformancePatterns(metrics: PerformanceMetrics[]): any {
    const platformPerformance = new Map();
    const typePerformance = new Map();

    for (const metric of metrics) {
      // Platform analysis
      if (!platformPerformance.has(metric.platform)) {
        platformPerformance.set(metric.platform, []);
      }
      platformPerformance.get(metric.platform).push(metric.engagement);
    }

    const topPerformers = Array.from(platformPerformance.entries())
      .map(([platform, engagements]) => ({
        platform,
        avgEngagement: engagements.reduce((a, b) => a + b, 0) / engagements.length
      }))
      .sort((a, b) => b.avgEngagement - a.avgEngagement);

    return {
      topPerformers: topPerformers.slice(0, 2),
      underPerformers: topPerformers.slice(-2),
      totalMetrics: metrics.length
    };
  }

  private async generateOptimizedContent(campaignId: number, insights: any, userId: string): Promise<void> {
    try {
      const campaign = await storage.getCampaign(campaignId, userId);
      if (!campaign) return;

      // Focus on top-performing platforms
      const optimizedPlatforms = insights.topPerformers.map(p => p.platform);
      
      if (optimizedPlatforms.length > 0) {
        const strategy = campaign.strategy || {};
        
        for (const platform of optimizedPlatforms) {
          const variations = await openAIService.generateContent(
            campaign.productDescription,
            strategy,
            platform,
            'post',
            campaign.marketingTone || 'professional'
          );

          for (const variation of variations) {
            await storage.createContent({
              campaignId,
              platform: variation.platform,
              type: variation.type,
              title: variation.title,
              body: variation.body,
              metadata: {
                hashtags: variation.hashtags,
                cta: variation.cta,
                optimized: true
              },
              status: 'draft'
            });
          }
        }

        // Schedule optimized content
        setTimeout(() => this.startDistribution(campaignId, userId), 5000);
      }
    } catch (error) {
      console.error(`[AutonomousEngine] Optimized content generation failed:`, error);
    }
  }

  private async simulateMetricsCollection(contentId: number, platform: string): Promise<PerformanceMetrics> {
    // Simulate realistic metrics based on platform
    const baseMetrics = {
      'LinkedIn': { views: 150, clicks: 12, engagement: 0.08 },
      'Twitter': { views: 300, clicks: 15, engagement: 0.05 },
      'Medium': { views: 80, clicks: 8, engagement: 0.10 },
      'Instagram': { views: 500, clicks: 25, engagement: 0.05 },
      'TikTok': { views: 1000, clicks: 50, engagement: 0.05 },
      'Pinterest': { views: 200, clicks: 10, engagement: 0.05 }
    };

    const base = baseMetrics[platform] || baseMetrics['LinkedIn'];
    
    // Add randomization
    const views = Math.floor(base.views * (0.5 + Math.random()));
    const clicks = Math.floor(base.clicks * (0.5 + Math.random()));
    const engagement = base.engagement * (0.7 + Math.random() * 0.6);
    const conversions = Math.floor(clicks * 0.1 * Math.random());

    let performance: 'performing' | 'neutral' | 'underperforming' = 'neutral';
    if (engagement > base.engagement * 1.2) performance = 'performing';
    if (engagement < base.engagement * 0.6) performance = 'underperforming';

    return {
      contentId,
      platform,
      timestamp: new Date(),
      views,
      clicks,
      engagement,
      conversions,
      performance
    };
  }

  private mapPlatformToType(platform: string): string {
    const mapping = {
      'LinkedIn': 'social',
      'Twitter': 'social',
      'Instagram': 'social',
      'TikTok': 'social',
      'Pinterest': 'social',
      'Medium': 'blog',
      'Blog': 'blog',
      'Reddit': 'forum',
      'Discord': 'forum',
      'Email': 'email'
    };
    return mapping[platform] || 'social';
  }

  private startEngine(): void {
    // Daily learning cycle check
    cron.schedule('0 0 * * *', () => {
      console.log('[AutonomousEngine] Running daily learning cycle check');
      this.states.forEach((state, campaignId) => {
        if (state.phase === 'continuous' || state.phase === 'feedback') {
          // Force learning cycle every 24h
          this.triggerLearningCycle(campaignId, 'system');
        }
      });
    });

    // Hourly system health check
    cron.schedule('0 * * * *', () => {
      console.log(`[AutonomousEngine] System health check - ${this.states.size} active campaigns`);
    });
  }

  // Public methods for external triggers
  public async emergencyStop(campaignId: number, reason: string, userId: string): Promise<void> {
    const state = this.states.get(campaignId);
    if (!state) return;

    console.log(`[AutonomousEngine] Emergency stop for campaign ${campaignId}: ${reason}`);
    
    await storage.createActivity({
      userId,
      type: 'emergency_stop',
      description: `Emergency stop triggered: ${reason}`,
      campaignId,
      metadata: { reason, previousPhase: state.phase }
    });

    // Pause all scheduled content
    const content = await storage.getContent(campaignId);
    const scheduledContent = content.filter(c => c.status === 'scheduled');
    
    for (const item of scheduledContent) {
      await storage.updateContent(item.id, { status: 'paused' });
    }

    state.phase = 'continuous'; // Safe state
  }

  public getEngineStatus(campaignId: number): AutonomousState | undefined {
    return this.states.get(campaignId);
  }

  public getCampaignStates(): Map<number, AutonomousState> {
    return this.states;
  }
}

export const autonomousEngine = new AutonomousMarketingEngine();