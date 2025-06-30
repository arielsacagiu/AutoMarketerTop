import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertCampaignSchema } from "@shared/schema";
import { Brain, Lightbulb } from "lucide-react";
import { z } from "zod";

const formSchema = insertCampaignSchema.extend({
  targetPlatforms: z.array(z.string()).min(1, "Select at least one platform"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateCampaignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateCampaignModal({ open, onOpenChange }: CreateCampaignModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      productDescription: "",
      marketingTone: "Professional",
      targetPlatforms: [],
      contentFrequency: "3x per week",
      duration: "1 month",
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: FormData) => {
      await apiRequest("POST", "/api/campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Campaign created successfully with AI-generated strategy!",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsGenerating(true);
    try {
      await createCampaignMutation.mutateAsync(data);
    } finally {
      setIsGenerating(false);
    }
  };

  const platforms = [
    { id: "linkedin", label: "LinkedIn" },
    { id: "twitter", label: "Twitter" },
    { id: "reddit", label: "Reddit" },
    { id: "medium", label: "Medium" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Create New Campaign
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="productDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Product/Service Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product or service that you want to market..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    The AI will generate a complete marketing strategy from this description
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Campaign Name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Q1 Product Launch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="marketingTone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Marketing Tone
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Professional">Professional</SelectItem>
                        <SelectItem value="Casual & Fun">Casual & Fun</SelectItem>
                        <SelectItem value="Premium & Luxury">Premium & Luxury</SelectItem>
                        <SelectItem value="Aggressive & Bold">Aggressive & Bold</SelectItem>
                        <SelectItem value="Educational & Helpful">Educational & Helpful</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="targetPlatforms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Target Platforms
                  </FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {platforms.map((platform) => (
                      <FormItem key={platform.id}>
                        <FormControl>
                          <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <Checkbox
                              checked={field.value?.includes(platform.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, platform.id]);
                                } else {
                                  field.onChange(field.value?.filter((p) => p !== platform.id));
                                }
                              }}
                            />
                            <span className="text-sm">{platform.label}</span>
                          </label>
                        </FormControl>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contentFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Content Frequency
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="3x per week">3x per week</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Campaign Duration
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1 week">1 week</SelectItem>
                        <SelectItem value="2 weeks">2 weeks</SelectItem>
                        <SelectItem value="1 month">1 month</SelectItem>
                        <SelectItem value="3 months">3 months</SelectItem>
                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Campaign Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the campaign" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">AI Strategy Preview</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    The AI will generate a complete marketing strategy including target audience analysis, 
                    content calendar, platform-specific messaging, and performance KPIs based on your inputs.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isGenerating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Campaign
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
