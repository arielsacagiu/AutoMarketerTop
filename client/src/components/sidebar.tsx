import { Link, useLocation } from "wouter";
import { Bot, BarChart3, Plus, Calendar, Users, Settings, Brain, FileText, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Create Campaign", href: "/campaigns/new", icon: Plus },
  { name: "Content Calendar", href: "/content-calendar", icon: Calendar },
  { name: "Leads & Contacts", href: "/leads", icon: Users },
  { name: "Automation", href: "/automation", icon: Settings },
  { name: "AI Insights", href: "/insights", icon: Brain },
  { name: "Content Library", href: "/content", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">AutoMarketer</h1>
        </div>
      </div>
      
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">AI Credits</span>
            <span className="text-xs">847/1000</span>
          </div>
          <div className="w-full bg-blue-400 rounded-full h-2">
            <div className="bg-white rounded-full h-2" style={{ width: "84.7%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
