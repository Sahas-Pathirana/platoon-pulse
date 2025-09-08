import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface LinkingRequest {
  id: string;
  application_number: string;
  full_name: string;
  date_of_birth: string | null;
  additional_info: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
}

const CadetLinkingForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<LinkingRequest | null>(null);
  const [formData, setFormData] = useState({
    application_number: '',
    full_name: user?.user_metadata?.full_name || '',
    date_of_birth: '',
    additional_info: ''
  });

  useEffect(() => {
    fetchExistingRequest();
  }, []);

  const fetchExistingRequest = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cadet_linking_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setExistingRequest(data as LinkingRequest);
    } catch (error: any) {
      console.error('Error fetching existing request:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.application_number.trim()) {
      toast({
        title: "Error",
        description: "Application number is required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cadet_linking_requests')
        .insert([
          {
            user_id: user?.id,
            application_number: formData.application_number.trim(),
            full_name: formData.full_name.trim(),
            date_of_birth: formData.date_of_birth || null,
            additional_info: formData.additional_info.trim() || null
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Linking request submitted successfully. An admin will review it shortly.",
      });

      // Reset form and refresh existing request
      setFormData({
        application_number: '',
        full_name: user?.user_metadata?.full_name || '',
        date_of_birth: '',
        additional_info: ''
      });
      
      fetchExistingRequest();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit linking request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Link Your Cadet Account
          </CardTitle>
          <CardDescription>
            Connect your user account to your cadet record by providing your application number.
            An admin will verify and approve your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {existingRequest ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(existingRequest.status)}
                    <span className="font-medium">Latest Linking Request</span>
                    {getStatusBadge(existingRequest.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p><span className="font-medium">Application Number:</span> {existingRequest.application_number}</p>
                    <p><span className="font-medium">Submitted:</span> {format(new Date(existingRequest.created_at), 'PPp')}</p>
                  </div>
                  {existingRequest.admin_notes && (
                    <div className="text-sm">
                      <span className="font-medium">Admin Notes:</span>
                      <p className="text-muted-foreground mt-1">{existingRequest.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {existingRequest.status === 'pending' && (
                <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Your request is being reviewed by an admin. Please wait for approval.
                  </p>
                </div>
              )}
              
              {existingRequest.status === 'rejected' && (
                <div className="text-sm">
                  <p className="text-muted-foreground mb-3">
                    You can submit a new request with corrected information.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          {/* Show form only if no pending request */}
          {!existingRequest || existingRequest.status === 'rejected' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="application_number">Application Number *</Label>
                <Input
                  id="application_number"
                  value={formData.application_number}
                  onChange={(e) => setFormData({ ...formData, application_number: e.target.value })}
                  placeholder="Enter your cadet application number"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name as in cadet records"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="additional_info">Additional Information (Optional)</Label>
                <Textarea
                  id="additional_info"
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  placeholder="Any additional information that might help verify your identity"
                  rows={3}
                />
              </div>
              
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Submitting..." : "Submit Linking Request"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

export default CadetLinkingForm;