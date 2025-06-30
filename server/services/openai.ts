import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-fake-key-for-development" 
});

export interface MarketingStrategy {
  targetAudience: string;
  valueProposition: string;
  keyMessages: string[];
  kpis: string[];
  contentThemes: string[];
  competitorInsights: string[];
}

export interface ContentVariation {
  platform: string;
  type: string;
  title?: string;
  body: string;
  hashtags?: string[];
  cta?: string;
}

export class OpenAIService {
  async generateMarketingStrategy(
    productDescription: string,
    marketingTone: string,
    targetPlatforms: string[]
  ): Promise<MarketingStrategy> {
    // Return a mock strategy when no API key is available
    if (!process.env.OPENAI_API_KEY) {
      return {
        targetAudience: `Target audience for ${productDescription}: Tech-savvy professionals and early adopters aged 25-45 who value innovation and efficiency. They are likely decision-makers in their organizations with disposable income for quality solutions.`,
        valueProposition: `Revolutionary solution that transforms how users approach their daily challenges, offering unparalleled efficiency and results.`,
        keyMessages: [
          "Innovative technology that saves time and increases productivity",
          "Trusted by industry leaders and innovative companies",
          "Easy to use with immediate results",
          "Backed by data-driven insights and proven methodology",
          "Join thousands of satisfied customers transforming their workflows"
        ],
        kpis: [
          "Monthly Active Users (MAU)",
          "Customer Acquisition Cost (CAC)",
          "Customer Lifetime Value (CLV)",
          "Conversion Rate",
          "Engagement Rate",
          "Net Promoter Score (NPS)"
        ],
        contentThemes: [
          "Success stories and case studies",
          "Industry insights and trends",
          "How-to guides and tutorials",
          "Behind-the-scenes content",
          "User-generated content",
          "Product updates and features",
          "Thought leadership articles"
        ],
        competitorInsights: [
          "Market is becoming increasingly competitive with new entrants",
          "Users value simplicity and ease of use over complex features",
          "Price sensitivity varies by market segment",
          "Brand trust and reputation are key differentiators",
          "Mobile-first approach is essential for market penetration"
        ]
      };
    }

    try {
      const prompt = `Generate a comprehensive marketing strategy for the following product/service. Return the response as JSON in the exact format specified.

Product/Service: ${productDescription}
Marketing Tone: ${marketingTone}
Target Platforms: ${targetPlatforms.join(", ")}

Please provide a marketing strategy with the following structure:
{
  "targetAudience": "Detailed description of the target audience including demographics, psychographics, and pain points",
  "valueProposition": "Clear, compelling value proposition that differentiates this product",
  "keyMessages": ["Array of 3-5 key marketing messages to emphasize"],
  "kpis": ["Array of 4-6 relevant KPIs to track success"],
  "contentThemes": ["Array of 5-7 content themes/topics to explore"],
  "competitorInsights": ["Array of 3-5 insights about competitive landscape and positioning"]
}

Ensure the strategy is tailored to the specified marketing tone and optimized for the target platforms.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing strategist. Always respond with valid JSON in the exact format requested."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result as MarketingStrategy;
    } catch (error) {
      console.error("Error generating marketing strategy:", error);
      throw new Error("Failed to generate marketing strategy");
    }
  }

  async generateContent(
    productDescription: string,
    strategy: MarketingStrategy,
    platform: string,
    contentType: string,
    marketingTone: string
  ): Promise<ContentVariation[]> {
    // Return mock content when no API key is available
    if (!process.env.OPENAI_API_KEY) {
      const mockContent: ContentVariation[] = [
        {
          platform,
          type: contentType,
          title: contentType === "article" ? `How ${productDescription} Is Changing the Game` : undefined,
          body: `🚀 Excited to share insights about ${productDescription}! This innovative solution is transforming how we approach daily challenges. The results speak for themselves - increased efficiency, better outcomes, and satisfied users everywhere. What's been your experience with similar solutions? #innovation #productivity`,
          hashtags: ["#innovation", "#productivity", "#technology", "#business"],
          cta: "Learn more about our solution"
        },
        {
          platform,
          type: contentType,
          title: contentType === "article" ? `The Future of ${productDescription}: Key Trends` : undefined,
          body: `Looking at the latest trends in ${productDescription}, it's clear that user-centric design and seamless integration are becoming the standard. Companies that prioritize these elements are seeing remarkable growth and customer satisfaction. Where do you see this space heading next?`,
          hashtags: ["#trends", "#future", "#userexperience", "#growth"],
          cta: "Join the conversation"
        },
        {
          platform,
          type: contentType,
          title: contentType === "article" ? `Why ${productDescription} Matters Now More Than Ever` : undefined,
          body: `In today's fast-paced world, ${productDescription} has become essential for staying competitive. The data shows clear benefits: improved efficiency, cost savings, and better outcomes. Ready to take the next step? Let's discuss how this can work for your specific needs.`,
          hashtags: ["#efficiency", "#competitive", "#results", "#success"],
          cta: "Get started today"
        }
      ];
      return mockContent;
    }

    try {
      const prompt = `Generate 3 variations of ${contentType} content for ${platform} based on the marketing strategy provided. Return as JSON array.

Product/Service: ${productDescription}
Platform: ${platform}
Content Type: ${contentType}
Marketing Tone: ${marketingTone}

Target Audience: ${strategy.targetAudience}
Value Proposition: ${strategy.valueProposition}
Key Messages: ${strategy.keyMessages.join(", ")}

Generate 3 different variations with this JSON structure:
[
  {
    "platform": "${platform}",
    "type": "${contentType}",
    "title": "Title if applicable (for blog posts, email subjects, etc.)",
    "body": "Main content text optimized for the platform",
    "hashtags": ["Array of relevant hashtags if applicable"],
    "cta": "Call-to-action text"
  }
]

Platform-specific requirements:
- LinkedIn: Professional tone, industry insights, thought leadership
- Twitter: Concise, engaging, conversation-starting
- Reddit: Community-focused, helpful, authentic
- Medium: In-depth, educational, storytelling
- Blog: Comprehensive, SEO-optimized, valuable

Ensure each variation explores different angles while maintaining the core message and tone.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert content creator specializing in platform-specific marketing content. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const result = JSON.parse(response.choices[0].message.content || "[]");
      return Array.isArray(result) ? result : [result];
    } catch (error) {
      console.error("Error generating content:", error);
      throw new Error("Failed to generate content");
    }
  }

  async generateLandingPageContent(
    productDescription: string,
    strategy: MarketingStrategy,
    campaignName: string
  ): Promise<{
    title: string;
    subtitle: string;
    content: string;
    ctaText: string;
    formFields: Array<{
      name: string;
      type: string;
      required: boolean;
      placeholder: string;
    }>;
  }> {
    try {
      const prompt = `Generate landing page content for lead capture based on the product and strategy provided. Return as JSON.

Product/Service: ${productDescription}
Campaign: ${campaignName}
Target Audience: ${strategy.targetAudience}
Value Proposition: ${strategy.valueProposition}

Generate landing page content with this structure:
{
  "title": "Compelling headline that grabs attention",
  "subtitle": "Supporting subtitle that reinforces the value proposition",
  "content": "Main body content in HTML format that explains benefits, features, and creates urgency",
  "ctaText": "Call-to-action button text",
  "formFields": [
    {
      "name": "email",
      "type": "email",
      "required": true,
      "placeholder": "Enter your email address"
    },
    {
      "name": "firstName",
      "type": "text",
      "required": true,
      "placeholder": "First Name"
    }
  ]
}

The landing page should be conversion-optimized with clear benefits, social proof elements, and a strong call-to-action.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert conversion copywriter specializing in high-converting landing pages. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result;
    } catch (error) {
      console.error("Error generating landing page content:", error);
      throw new Error("Failed to generate landing page content");
    }
  }

  async analyzePerformance(
    contentSamples: Array<{ content: string; engagement: number; platform: string }>,
    strategy: MarketingStrategy
  ): Promise<{
    insights: string[];
    recommendations: string[];
    optimizations: string[];
  }> {
    try {
      const prompt = `Analyze the performance of these content pieces and provide insights for optimization. Return as JSON.

Content Performance Data:
${contentSamples.map((sample, i) => 
  `${i + 1}. Platform: ${sample.platform}, Engagement Rate: ${sample.engagement}%, Content: "${sample.content.substring(0, 200)}..."`
).join("\n")}

Original Strategy:
Target Audience: ${strategy.targetAudience}
Key Messages: ${strategy.keyMessages.join(", ")}

Provide analysis in this format:
{
  "insights": ["Array of 3-5 key insights about what's working and what isn't"],
  "recommendations": ["Array of 3-5 specific recommendations for improvement"],
  "optimizations": ["Array of 3-5 tactical optimizations to implement"]
}

Focus on actionable insights that can improve future content performance.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing analyst specializing in content performance optimization. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return result;
    } catch (error) {
      console.error("Error analyzing performance:", error);
      throw new Error("Failed to analyze performance");
    }
  }
}

export const openAIService = new OpenAIService();
