import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, Eye, User, Calendar } from "lucide-react";
import { format } from "date-fns";

interface LinkingRequest {
  id: string;
  user_id: string;
  application_number: string;
  full_name: string;
  date_of_birth: string | null;
  additional_info: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  created_at: string;
  user_profiles: {
    email: string;
    full_name: string;
  } | null;
}

const AdminLinkingRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<LinkingRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<LinkingRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchLinkingRequests();
  }, []);

  const fetchLinkingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('cadet_linking_requests')
        .select(`
          *,
          user_profiles!inner(email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as unknown as LinkingRequest[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch linking requests: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('approve_cadet_linking', {
        request_id: selectedRequest.id,
        admin_notes_param: adminNotes || null
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        setIsDialogOpen(false);
        setAdminNotes('');
        fetchLinkingRequests();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.rpc('reject_cadet_linking', {
        request_id: selectedRequest.id,
        admin_notes_param: adminNotes || null
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string };
      
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        setIsDialogOpen(false);
        setAdminNotes('');
        fetchLinkingRequests();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Account Linking Requests
        </CardTitle>
        <CardDescription>
          Review and approve student requests to link their accounts to cadet records
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Requests ({requests.length})
            </h3>
            <Button onClick={fetchLinkingRequests} variant="outline">
              Refresh
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Application No.</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No linking requests found
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.user_profiles?.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">{request.user_profiles?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{request.application_number}</TableCell>
                      <TableCell>{request.full_name}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(request.created_at), 'PPp')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setAdminNotes(request.admin_notes || '');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review Linking Request</DialogTitle>
                              <DialogDescription>
                                Verify student information and approve or reject the account linking request
                              </DialogDescription>
                            </DialogHeader>
                            
                            {selectedRequest && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Student Account</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="font-medium">Email:</span> {selectedRequest.user_profiles?.email}</p>
                                      <p><span className="font-medium">Account Name:</span> {selectedRequest.user_profiles?.full_name}</p>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="font-semibold mb-2">Requested Link</h4>
                                    <div className="space-y-1 text-sm">
                                      <p><span className="font-medium">Application No:</span> {selectedRequest.application_number}</p>
                                      <p><span className="font-medium">Full Name:</span> {selectedRequest.full_name}</p>
                                      {selectedRequest.date_of_birth && (
                                        <p><span className="font-medium">Date of Birth:</span> {format(new Date(selectedRequest.date_of_birth), 'PP')}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {selectedRequest.additional_info && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Additional Information</h4>
                                    <p className="text-sm text-muted-foreground">{selectedRequest.additional_info}</p>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <Label htmlFor="admin-notes">Admin Notes</Label>
                                  <Textarea
                                    id="admin-notes"
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Add any notes about this request (optional)"
                                    rows={3}
                                  />
                                </div>

                                {selectedRequest.status === 'pending' && (
                                  <div className="flex justify-end gap-2 pt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => setIsDialogOpen(false)}
                                      disabled={isProcessing}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleRejectRequest}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? "Processing..." : "Reject"}
                                    </Button>
                                    <Button
                                      onClick={handleApproveRequest}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? "Processing..." : "Approve"}
                                    </Button>
                                  </div>
                                )}

                                {selectedRequest.status !== 'pending' && (
                                  <div className="pt-4">
                                    <p className="text-sm text-muted-foreground">
                                      This request has already been {selectedRequest.status}.
                                    </p>
                                    {selectedRequest.admin_notes && (
                                      <div className="mt-2 p-3 bg-muted/50 rounded-md">
                                        <p className="text-sm font-medium">Admin Notes:</p>
                                        <p className="text-sm text-muted-foreground">{selectedRequest.admin_notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminLinkingRequests;