
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CadetAttendanceMarking from "@/components/CadetAttendanceMarking";
import { Badge, Calendar, User, Award, Settings, Lock, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

const CadetDashboard = () => {
  const { user } = useAuth();
  const [cadetDetails, setCadetDetails] = useState<any>(null);
  const { toast } = useToast();

  // Fetch cadet details from Supabase
  useEffect(() => {
    const fetchCadetDetails = async () => {
      let cadetId = user?.cadet_id;
      if (!cadetId) {
        const { data: rpcCadetId } = await supabase.rpc('current_cadet_id');
        cadetId = rpcCadetId as string;
      }
      if (!cadetId) return;
      const { data, error } = await supabase
        .from('cadets')
        .select('*')
        .eq('id', cadetId)
        .single();
      if (!error && data) setCadetDetails(data);
    };
    fetchCadetDetails();
  }, [user?.cadet_id]);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [attendancePercentage, setAttendancePercentage] = useState<number>(0);

  // Fetch and calculate average attendance percentage
  const fetchAttendancePercentage = async () => {
    let cadetId = user?.cadet_id;
    if (!cadetId) {
      const { data: rpcCadetId } = await supabase.rpc('current_cadet_id');
      cadetId = rpcCadetId as string;
    }
    if (!cadetId) return;
    const { data, error } = await supabase
      .from('cadet_attendance')
      .select('attendance_percentage, entry_time, exit_time')
      .eq('cadet_id', cadetId);
    if (error || !data || data.length === 0) {
      setAttendancePercentage(0);
      return;
    }
    // Only include sessions with both entry and exit times
    const validRecords = data.filter((record: any) => record.entry_time && record.exit_time);
    if (validRecords.length === 0) {
      setAttendancePercentage(0);
      return;
    }
    const total = validRecords.reduce((sum: number, record: any) => sum + (record.attendance_percentage || 0), 0);
    const avg = total / validRecords.length;
    setAttendancePercentage(Number.isFinite(avg) ? avg : 0);
  };

  useEffect(() => {
    fetchAttendancePercentage();
  }, [user?.cadet_id]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully",
      });

      setIsPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user has cadet_id linked
  const hasLinkedCadet = user?.cadet_id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasLinkedCadet && (
          <div className="mb-6">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-900">Account Linking Required</h3>
                    <p className="text-sm text-orange-700">
                      Your account is not linked to a cadet record. Please submit a linking request to access all features.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <div className="mb-8 flex flex-col items-center justify-center">
          {/* Profile Photo Avatar */}
          <div className="mb-4">
            {cadetDetails?.photograph_url ? (
              <img
                src={cadetDetails.photograph_url}
                alt="Profile"
                className="h-28 w-28 rounded-full object-cover border-4 border-primary shadow"
                style={{ background: '#f3f4f6' }}
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-muted flex items-center justify-center border-4 border-primary shadow">
                <User className="h-14 w-14 text-muted-foreground" />
              </div>
            )}
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            Welcome, {user?.user_metadata?.full_name || 'Cadet'}
          </h2>
          <p className="text-muted-foreground mt-2">
            View your cadet information and records
          </p>
        </div>

        <div className="flex justify-end mb-6">
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Account Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Update Password
                </DialogTitle>
                <DialogDescription>
                  Change your account password for better security
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPasswordDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Rank</CardTitle>
              <Badge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Cadet</div>
              <p className="text-xs text-muted-foreground">Starting rank</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platoon</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Assignment pending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendancePercentage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">This term</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>
        </div>


        <Tabs defaultValue={hasLinkedCadet ? "overview" : "linking"} className="w-full">
          <TabsList>
            {!hasLinkedCadet && <TabsTrigger value="linking">Link Account</TabsTrigger>}
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="attendance" disabled={false}>Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>Your basic cadet details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Email:</span>
                      <p className="text-sm">{user?.email}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Full Name:</span>
                      <p className="text-sm">{user?.user_metadata?.full_name || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Application Number:</span>
                      <p className="text-sm">{cadetDetails?.application_number || 'To be assigned'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Date of Birth:</span>
                      <p className="text-sm">{cadetDetails?.dob || 'To be updated'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Non-editable section for all admin-entered details */}
              {cadetDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Details (Admin Entered)</CardTitle>
                    <CardDescription>These details cannot be edited</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div><span className="font-medium">Full Name:</span> <span>{cadetDetails.name_full}</span></div>
                      <div><span className="font-medium">Name with Initials:</span> <span>{cadetDetails.name_with_initials}</span></div>
                      <div><span className="font-medium">Application Number:</span> <span>{cadetDetails.application_number}</span></div>
                      <div><span className="font-medium">Platoon:</span> <span>{cadetDetails.platoon}</span></div>
                      <div><span className="font-medium">Rank:</span> <span>{cadetDetails.rank}</span></div>
                      <div><span className="font-medium">Date of Birth:</span> <span>{cadetDetails.dob}</span></div>
                      <div><span className="font-medium">Contact Number:</span> <span>{cadetDetails.contact_number}</span></div>
                      <div><span className="font-medium">Address:</span> <span>{cadetDetails.address}</span></div>
                      {/* Add more fields as needed based on your cadets table */}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your latest cadet activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No recent activity to display.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Training Progress</CardTitle>
                  <CardDescription>Your training and skill development</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Training records will appear here once available.</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>Training camps and activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="attendance">
            <CadetAttendanceMarking onAttendanceMarked={() => {
              setTimeout(() => {
                fetchAttendancePercentage();
              }, 500);
            }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CadetDashboard;