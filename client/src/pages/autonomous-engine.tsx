import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Activity, Brain, Clock, TrendingUp, AlertTriangle, Play, Pause } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AutonomousEngine() {
  const queryClient = useQueryClient();
  
  const { data: overview, isLoading } = useQuery({
    queryKey: ['/api/engine/overview'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stopEngineMutation = useMutation({
    mutationFn: async ({ campaignId, reason }: { campaignId: number; reason: string }) => {
      return apiRequest(`/api/campaigns/${campaignId}/engine-stop`, 'POST', { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/engine/overview'] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'continuous': return 'bg-green-500';
      case 'feedback': return 'bg-blue-500';
      case 'learning': return 'bg-purple-500';
      case 'distribution': return 'bg-orange-500';
      case 'strategy': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getPhaseDescription = (phase: string) => {
    switch (phase) {
      case 'continuous': return 'Operating autonomously with periodic optimization';
      case 'feedback': return 'Collecting performance data across platforms';
      case 'learning': return 'AI analyzing patterns and optimizing strategy';
      case 'distribution': return 'Publishing content across target platforms';
      case 'strategy': return 'Generating marketing strategy from product data';
      default: return 'Engine status unknown';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Autonomous Engine</h1>
          <p className="text-muted-foreground">
            Monitor and control your autonomous marketing campaigns with sophisticated timing and feedback loops
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-4 h-4 mr-1" />
            {overview?.length || 0} Active Campaigns
          </Badge>
        </div>
      </div>

      {/* Engine Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Active Engines</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Autonomous campaigns running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.reduce((sum, campaign) => sum + (campaign.dailyMetrics?.views || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Total views across all campaigns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Cycles</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.reduce((sum, campaign) => sum + (campaign.learningBankSize || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed optimization cycles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {overview?.map((campaign) => (
          <Card key={campaign.campaignId} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <CardDescription>Campaign #{campaign.campaignId}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPhaseColor(campaign.phase)}>
                    {campaign.phase}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => stopEngineMutation.mutate({ 
                      campaignId: campaign.campaignId, 
                      reason: 'Manual stop from dashboard' 
                    })}
                    disabled={stopEngineMutation.isPending}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Stop
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {getPhaseDescription(campaign.phase)}
                </p>
                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Last optimization: {formatDistanceToNow(new Date(campaign.lastMutation))} ago</span>
                </div>
              </div>

              {/* Platform Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-2">Target Platforms</h4>
                <div className="flex flex-wrap gap-1">
                  {campaign.platforms?.map((platform) => (
                    <Badge key={platform} variant="secondary" className="text-xs">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Views</p>
                  <p className="font-semibold">{campaign.dailyMetrics?.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clicks</p>
                  <p className="font-semibold">{campaign.dailyMetrics?.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conversions</p>
                  <p className="font-semibold">{campaign.dailyMetrics?.conversions}</p>
                </div>
              </div>

              {/* Learning Progress */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Learning Progress</span>
                  <span>{campaign.performanceDataCount}/20 data points</span>
                </div>
                <Progress value={(campaign.performanceDataCount / 20) * 100} className="h-2" />
              </div>

              {/* Autonomous Engine Status */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                <h4 className="text-sm font-medium">Autonomous Engine Status</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-1 font-medium">{campaign.status}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Learning Bank:</span>
                    <span className="ml-1 font-medium">{campaign.learningBankSize} cycles</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Timing and Feedback Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Autonomous Engine Timing Schema
          </CardTitle>
          <CardDescription>
            Sophisticated feedback loops with platform-specific timing patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Social Platforms</h4>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Initial Wait:</span> 45 minutes</p>
                <p><span className="font-medium">Feedback Sweeps:</span> +2h, +2h, +2h, +24h</p>
                <p><span className="font-medium">Mutation Window:</span> 24 hours</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Blog Platforms</h4>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Initial Wait:</span> 2 hours</p>
                <p><span className="font-medium">Feedback Sweeps:</span> +6h, +24h, daily</p>
                <p><span className="font-medium">Mutation Window:</span> 24 hours</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Forum Platforms</h4>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Initial Wait:</span> 1 hour</p>
                <p><span className="font-medium">Feedback Sweeps:</span> +6h, +24h, daily</p>
                <p><span className="font-medium">Mutation Window:</span> 24 hours</p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Email Campaigns</h4>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Initial Wait:</span> 2 hours</p>
                <p><span className="font-medium">Feedback Sweeps:</span> +12h, +24h, daily</p>
                <p><span className="font-medium">Mutation Window:</span> 24 hours</p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">Adaptive Learning Principles</p>
                <p className="text-blue-700 dark:text-blue-200 mt-1">
                  The engine prevents premature optimization by waiting for platform-specific signal maturity. 
                  Content and schedule mutations only occur after sufficient data collection and every 24 hours 
                  or during critical performance events.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}