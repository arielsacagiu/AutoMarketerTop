import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

export default function PerformanceCharts() {
  const platformStats = [
    { name: "LinkedIn", percentage: 65, color: "bg-blue-500" },
    { name: "Twitter", percentage: 45, color: "bg-emerald-500" },
    { name: "Reddit", percentage: 30, color: "bg-orange-500" },
    { name: "Medium", percentage: 25, color: "bg-purple-500" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Content Performance</CardTitle>
          <Select defaultValue="7days">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 font-medium">Performance Chart</p>
              <p className="text-xs text-gray-400">Chart integration coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">Platform Distribution</CardTitle>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
            View Details
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformStats.map((platform) => (
              <div key={platform.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${platform.color} rounded-full`}></div>
                  <span className="text-sm font-medium text-gray-700">{platform.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${platform.color} h-2 rounded-full`} 
                      style={{ width: `${platform.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{platform.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
