import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Lightbulb } from "lucide-react";

export default function AutonomousStatus() {
  const { data: activities } = useQuery({
    queryKey: ["/api/dashboard/activities"],
  });

  const todaysMissions = [
    {
      title: "Posted 3 LinkedIn articles",
      time: "2:34 PM",
      completed: true,
    },
    {
      title: "Generate blog content for tomorrow",
      time: "4:00 PM",
      completed: false,
    },
    {
      title: "Update Reddit community posts",
      time: "6:00 PM",
      completed: false,
    },
  ];

  const aiInsights = [
    "Tuesday posts get 23% higher engagement",
    "Question-format headlines perform best on LinkedIn",
    "Tech community subreddits show highest conversion",
  ];

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Autonomous Marketing Status
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse-slow"></div>
            <span className="text-sm text-emerald-600 font-medium">Active</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Today's Missions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Today's Missions</h4>
            <div className="space-y-3">
              {todaysMissions.map((mission, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {mission.completed ? (
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-500" />
                    )}
                    <span className="text-sm text-gray-700">{mission.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">{mission.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Learning Insights */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">AI Learning Insights</h4>
            <div className="space-y-2">
              {aiInsights.map((insight, index) => (
                <p key={index} className="text-sm text-gray-700 flex items-start">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                  {insight}
                </p>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
