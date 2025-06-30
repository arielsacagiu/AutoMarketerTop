import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Brain, Globe } from "lucide-react";
import CreateCampaignModal from "@/components/modals/create-campaign-modal";

export default function QuickActions() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <>
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          <Button 
            variant="outline"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 font-medium"
          >
            <Brain className="h-4 w-4 mr-2" />
            Generate Content
          </Button>
          <Button 
            variant="outline"
            className="w-full bg-orange-600 hover:bg-orange-700 text-white border-orange-600 font-medium"
          >
            <Globe className="h-4 w-4 mr-2" />
            Create Landing Page
          </Button>
        </CardContent>
      </Card>

      <CreateCampaignModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}
