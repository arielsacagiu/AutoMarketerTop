import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Play, Pause, Edit, Plus, Brain, CheckCircle, AlertCircle } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay, parseISO } from "date-fns";

interface ContentItem {
  id: number;
  campaignId: number;
  platform: string;
  type: string;
  title?: string;
  body: string;
  metadata?: {
    hashtags?: string[];
    cta?: string;
  };
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
}

interface Campaign {
  id: number;
  name: string;
  status: string;
}

export default function ContentCalendar() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    enabled: isAuthenticated,
  });

  // Fetch content for selected campaign
  const { data: allContent = [], isLoading: contentLoading } = useQuery({
    queryKey: ["/api/campaigns/content", selectedCampaign],
    queryFn: async () => {
      if (selectedCampaign === "all") {
        // Fetch content for all campaigns
        const contentPromises = campaigns.map((campaign: Campaign) =>
          fetch(`/api/campaigns/${campaign.id}/content`, { credentials: "include" })
            .then(res => res.json())
        );
        const results = await Promise.all(contentPromises);
        return results.flat();
      } else {
        const response = await fetch(`/api/campaigns/${selectedCampaign}/content`, {
          credentials: "include",
        });
        return response.json();
      }
    },
    enabled: isAuthenticated && campaigns.length > 0,
  });

  // Schedule content mutation
  const scheduleContentMutation = useMutation({
    mutationFn: async ({ contentId, scheduledAt }: { contentId: number; scheduledAt: string }) => {
      await apiRequest("PATCH", `/api/content/${contentId}/schedule`, { scheduledAt });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/content"] });
      toast({
        title: "Success",
        description: "Content scheduled successfully",
      });
      setShowScheduleModal(false);
      setSelectedContent(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule content",
        variant: "destructive",
      });
    },
  });

  // Publish content mutation
  const publishContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      await apiRequest("POST", `/api/content/${contentId}/publish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns/content"] });
      toast({
        title: "Success",
        description: "Content published successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish content",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge className="bg-emerald-100 text-emerald-800">Published</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case "draft":
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      linkedin: "border-l-blue-500",
      twitter: "border-l-sky-500",
      reddit: "border-l-orange-500",
      medium: "border-l-purple-500",
    };
    return colors[platform.toLowerCase()] || "border-l-gray-500";
  };

  const getContentForDay = (day: Date) => {
    return allContent.filter((content: ContentItem) => {
      if (content.scheduledAt) {
        return isSameDay(parseISO(content.scheduledAt), day);
      }
      if (content.publishedAt) {
        return isSameDay(parseISO(content.publishedAt), day);
      }
      return false;
    });
  };

  const handleScheduleContent = (content: ContentItem) => {
    setSelectedContent(content);
    setScheduleDate(format(new Date(), "yyyy-MM-dd"));
    setScheduleTime("09:00");
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = () => {
    if (!selectedContent || !scheduleDate || !scheduleTime) return;
    
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
    scheduleContentMutation.mutate({
      contentId: selectedContent.id,
      scheduledAt,
    });
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
              <p className="text-gray-600">Schedule and manage your content across platforms</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map((campaign: Campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id.toString()}>
                      {campaign.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Brain className="h-4 w-4 mr-2" />
                Generate Content
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6 space-y-6">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
              >
                ← Previous Week
              </Button>
              <h3 className="text-lg font-semibold">
                {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
              </h3>
              <Button
                variant="outline"
                onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
              >
                Next Week →
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedWeek(new Date())}
            >
              Today
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-600">Published</p>
                    <p className="text-xl font-bold">
                      {allContent.filter((c: ContentItem) => c.status === "published").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Scheduled</p>
                    <p className="text-xl font-bold">
                      {allContent.filter((c: ContentItem) => c.status === "scheduled").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Edit className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Drafts</p>
                    <p className="text-xl font-bold">
                      {allContent.filter((c: ContentItem) => c.status === "draft").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-xl font-bold">
                      {weekDays.reduce((count, day) => count + getContentForDay(day).length, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Calendar Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Content Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              {contentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-4">
                  {weekDays.map((day) => {
                    const dayContent = getContentForDay(day);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`border rounded-lg p-3 min-h-48 ${
                          isToday ? "border-blue-300 bg-blue-50" : "border-gray-200"
                        }`}
                      >
                        <div className="font-medium text-sm mb-2">
                          {format(day, "EEE")}
                          <span className={`ml-1 ${isToday ? "text-blue-600" : "text-gray-600"}`}>
                            {format(day, "d")}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          {dayContent.map((content: ContentItem) => (
                            <div
                              key={content.id}
                              className={`p-2 rounded border-l-4 bg-white text-xs ${getPlatformColor(content.platform)}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium capitalize">{content.platform}</span>
                                {getStatusBadge(content.status)}
                              </div>
                              <p className="text-gray-600 truncate">
                                {content.title || content.body.substring(0, 50)}...
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-gray-500">
                                  {content.scheduledAt 
                                    ? format(parseISO(content.scheduledAt), "HH:mm")
                                    : content.publishedAt 
                                    ? format(parseISO(content.publishedAt), "HH:mm")
                                    : "Not scheduled"
                                  }
                                </span>
                                <div className="flex space-x-1">
                                  {content.status === "draft" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleScheduleContent(content)}
                                    >
                                      <Clock className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {content.status === "scheduled" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => publishContentMutation.mutate(content.id)}
                                    >
                                      <Play className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Autonomous Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow"></div>
                <span>Autonomous Content Engine</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <div>
                    <p className="font-medium">Content Generation</p>
                    <p className="text-sm text-gray-600">Active - Next batch in 2 hours</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Auto Scheduling</p>
                    <p className="text-sm text-gray-600">Optimizing for peak engagement</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium">Performance Learning</p>
                    <p className="text-sm text-gray-600">Analyzing 47 data points</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unscheduled Content */}
          {allContent.filter((c: ContentItem) => c.status === "draft").length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Unscheduled Content</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allContent
                    .filter((c: ContentItem) => c.status === "draft")
                    .slice(0, 5)
                    .map((content: ContentItem) => (
                      <div
                        key={content.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge variant="outline" className="capitalize">
                              {content.platform}
                            </Badge>
                            <span className="text-sm text-gray-500 capitalize">{content.type}</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {content.title || content.body.substring(0, 100)}...
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleScheduleContent(content)}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Schedule
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => publishContentMutation.mutate(content.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Publish Now
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* Schedule Modal */}
      <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContent && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-2 mb-2">
                  <Badge variant="outline" className="capitalize">
                    {selectedContent.platform}
                  </Badge>
                  <span className="text-sm text-gray-500 capitalize">
                    {selectedContent.type}
                  </span>
                </div>
                <p className="text-sm text-gray-700">
                  {selectedContent.title || selectedContent.body.substring(0, 100)}...
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schedule-date">Date</Label>
                <Input
                  id="schedule-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="schedule-time">Time</Label>
                <Input
                  id="schedule-time"
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleSubmit}
                disabled={scheduleContentMutation.isPending}
              >
                {scheduleContentMutation.isPending ? "Scheduling..." : "Schedule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
