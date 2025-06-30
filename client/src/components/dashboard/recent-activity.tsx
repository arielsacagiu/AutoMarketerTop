import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share, UserPlus, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RecentActivity() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/dashboard/activities"],
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "content_posted":
        return Share;
      case "lead_captured":
        return UserPlus;
      case "content_generated":
        return Edit;
      default:
        return Edit;
    }
  };

  const getActivityIconColor = (type: string) => {
    switch (type) {
      case "content_posted":
        return "bg-blue-100 text-blue-600";
      case "lead_captured":
        return "bg-emerald-100 text-emerald-600";
      case "content_generated":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities && activities.length > 0 ? (
          activities.slice(0, 5).map((activity: any) => {
            const Icon = getActivityIcon(activity.type);
            const iconColors = getActivityIconColor(activity.type);
            
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${iconColors} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No recent activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
