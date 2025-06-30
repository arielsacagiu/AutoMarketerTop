import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, TrendingUp, Zap, Target, BarChart3, Users } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
              <Bot className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">AutoMarketer</h1>
          </div>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Autonomous Marketing That Never Sleeps
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Let AI handle your entire marketing pipeline. From strategy generation to content creation, 
            distribution, and optimization - all running autonomously in the background.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
          >
            Start Your AI Marketing Engine
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Truly Autonomous Marketing
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Set it once, and watch your marketing machine generate leads while you focus on your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>AI Strategy Generation</CardTitle>
              <CardDescription>
                Input your product description and get a complete marketing strategy with audience analysis, 
                messaging, and channel recommendations.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Autonomous Content Creation</CardTitle>
              <CardDescription>
                AI generates and schedules platform-specific content for LinkedIn, Twitter, Reddit, 
                and blog platforms automatically.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Self-Learning Optimization</CardTitle>
              <CardDescription>
                The system analyzes performance data and automatically adapts content strategy 
                to improve engagement and conversions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Lead Capture Automation</CardTitle>
              <CardDescription>
                Auto-generates landing pages, captures leads, and nurtures them through 
                personalized email sequences.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Real-time Analytics</CardTitle>
              <CardDescription>
                Track performance across all channels with detailed analytics and 
                AI-powered insights for continuous improvement.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Multi-platform Distribution</CardTitle>
              <CardDescription>
                Automatically distributes content to multiple platforms with 
                platform-specific optimization and timing.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Scale Your Marketing Autonomously?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of businesses already using AI to generate leads while they sleep.
          </p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            size="lg"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-4"
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600">
        <p>&copy; 2024 AutoMarketer. All rights reserved.</p>
      </footer>
    </div>
  );
}
