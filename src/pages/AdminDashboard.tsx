import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { CadetRegistrationForm } from "@/components/CadetRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Shield, Edit, Trash2, FileText, Download, Calendar, Award, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Cadet {
  id: string;
  name_full: string;
  name_with_initials: string;
  application_number: string;
  date_of_birth: string;
  platoon: string;
  rank: string;
  age: number;
  created_at: string;
  updated_at: string;
}

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalCadets: 0,
    juniorPlatoon: 0,
    seniorPlatoon: 0,
    recentJoins: 0
  });


  const [editCadet, setEditCadet] = useState<Partial<Cadet>>({});

  useEffect(() => {
    fetchCadets();
  }, []);

  const fetchCadets = async () => {
    try {
      const { data, error } = await supabase
        .from('cadets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCadets(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const junior = data?.filter(c => c.platoon === 'Junior').length || 0;
      const senior = data?.filter(c => c.platoon === 'Senior').length || 0;
      const recent = data?.filter(c => {
        const createdDate = new Date(c.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return createdDate > thirtyDaysAgo;
      }).length || 0;

      setStats({
        totalCadets: total,
        juniorPlatoon: junior,
        seniorPlatoon: senior,
        recentJoins: recent
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cadets: " + error.message,
        variant: "destructive",
      });
    }
  };


  const handleEditCadet = async () => {
    if (!selectedCadet) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('cadets')
        .update(editCadet)
        .eq('id', selectedCadet.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cadet information updated successfully",
      });

      setIsEditDialogOpen(false);
      fetchCadets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update cadet",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCadet = async (cadetId: string) => {
    if (!confirm("Are you sure you want to delete this cadet? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('cadets')
        .delete()
        .eq('id', cadetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Cadet deleted successfully",
      });

      fetchCadets();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete cadet",
        variant: "destructive",
      });
    }
  };

  const generateReport = async (type: string) => {
    try {
      let reportData = '';
      const timestamp = new Date().toISOString().split('T')[0];
      
      switch (type) {
        case 'cadets':
          reportData = `Cadet Report - ${timestamp}\n\n`;
          reportData += `Total Cadets: ${stats.totalCadets}\n`;
          reportData += `Junior Platoon: ${stats.juniorPlatoon}\n`;
          reportData += `Senior Platoon: ${stats.seniorPlatoon}\n\n`;
          reportData += `Cadet Details:\n`;
          reportData += `${'Name'.padEnd(30)} ${'App No'.padEnd(10)} ${'Platoon'.padEnd(10)} ${'Rank'.padEnd(15)} ${'Age'.padEnd(5)}\n`;
          reportData += '-'.repeat(80) + '\n';
          
          cadets.forEach(cadet => {
            reportData += `${cadet.name_full.padEnd(30)} ${cadet.application_number.padEnd(10)} ${(cadet.platoon || '').padEnd(10)} ${(cadet.rank || 'Cadet').padEnd(15)} ${(cadet.age || '').toString().padEnd(5)}\n`;
          });
          break;
          
        case 'attendance':
          reportData = `Attendance Report - ${timestamp}\n\n`;
          reportData += `This report would contain attendance statistics and records.\n`;
          reportData += `Feature coming soon with attendance tracking implementation.\n`;
          break;
          
        case 'performance':
          reportData = `Performance Report - ${timestamp}\n\n`;
          reportData += `This report would contain performance evaluations and rankings.\n`;
          reportData += `Feature coming soon with performance tracking implementation.\n`;
          break;
      }

      // Create and download file
      const blob = new Blob([reportData], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${timestamp}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} report downloaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Manage cadet accounts and information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cadets</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCadets}</div>
              <p className="text-xs text-muted-foreground">Active cadet records</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Junior Platoon</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.juniorPlatoon}</div>
              <p className="text-xs text-muted-foreground">Ages 12-14</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Senior Platoon</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.seniorPlatoon}</div>
              <p className="text-xs text-muted-foreground">Ages 14-20</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Joins</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentJoins}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="create-account" className="w-full">
          <TabsList>
            <TabsTrigger value="create-account">Create Cadet Account</TabsTrigger>
            <TabsTrigger value="manage-cadets">Manage Cadets</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create-account">
            <CadetRegistrationForm onSuccess={fetchCadets} />
          </TabsContent>
          
          <TabsContent value="manage-cadets">
            <Card>
              <CardHeader>
                <CardTitle>Manage Cadets</CardTitle>
                <CardDescription>View and manage existing cadet records</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Cadet List ({cadets.length})</h3>
                    <Button onClick={fetchCadets} variant="outline">
                      Refresh
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>App No.</TableHead>
                          <TableHead>Platoon</TableHead>
                          <TableHead>Rank</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cadets.map((cadet) => (
                          <TableRow key={cadet.id}>
                            <TableCell className="font-medium">{cadet.name_full}</TableCell>
                            <TableCell>{cadet.application_number}</TableCell>
                            <TableCell>
                              <Badge variant={cadet.platoon === 'Junior' ? 'secondary' : 'default'}>
                                {cadet.platoon}
                              </Badge>
                            </TableCell>
                            <TableCell>{cadet.rank || 'Cadet'}</TableCell>
                            <TableCell>{cadet.age || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedCadet(cadet);
                                        setEditCadet(cadet);
                                      }}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Edit Cadet Information</DialogTitle>
                                      <DialogDescription>
                                        Update cadet details below
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-name">Full Name</Label>
                                        <Input
                                          id="edit-name"
                                          value={editCadet.name_full || ''}
                                          onChange={(e) => setEditCadet({ ...editCadet, name_full: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-initials">Name with Initials</Label>
                                        <Input
                                          id="edit-initials"
                                          value={editCadet.name_with_initials || ''}
                                          onChange={(e) => setEditCadet({ ...editCadet, name_with_initials: e.target.value })}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-platoon">Platoon</Label>
                                        <select
                                          id="edit-platoon"
                                          value={editCadet.platoon || ''}
                                          onChange={(e) => setEditCadet({ ...editCadet, platoon: e.target.value })}
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          <option value="Junior">Junior</option>
                                          <option value="Senior">Senior</option>
                                        </select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="edit-rank">Rank</Label>
                                        <select
                                          id="edit-rank"
                                          value={editCadet.rank || 'Cadet'}
                                          onChange={(e) => setEditCadet({ ...editCadet, rank: e.target.value })}
                                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          <option value="Cadet">Cadet</option>
                                          <option value="Lance Corporal">Lance Corporal</option>
                                          <option value="Corporal">Corporal</option>
                                          <option value="Sergeant">Sergeant</option>
                                          <option value="Staff Sergeant">Staff Sergeant</option>
                                          <option value="Warrant Officer">Warrant Officer</option>
                                          <option value="Under Officer">Under Officer</option>
                                        </select>
                                      </div>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                      <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                        Cancel
                                      </Button>
                                      <Button onClick={handleEditCadet} disabled={isLoading}>
                                        {isLoading ? "Updating..." : "Update"}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteCadet(cadet.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {cadets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No cadets found. Create your first cadet account to get started.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Reports & Analytics</span>
                  </CardTitle>
                  <CardDescription>Generate and download various reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-2 border-dashed">
                      <CardHeader className="text-center">
                        <Users className="h-8 w-8 mx-auto text-primary" />
                        <CardTitle className="text-lg">Cadet Report</CardTitle>
                        <CardDescription>Complete list of all cadets with details</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => generateReport('cadets')} 
                          className="w-full"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed">
                      <CardHeader className="text-center">
                        <Calendar className="h-8 w-8 mx-auto text-primary" />
                        <CardTitle className="text-lg">Attendance Report</CardTitle>
                        <CardDescription>Attendance statistics and records</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => generateReport('attendance')} 
                          className="w-full"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed">
                      <CardHeader className="text-center">
                        <Award className="h-8 w-8 mx-auto text-primary" />
                        <CardTitle className="text-lg">Performance Report</CardTitle>
                        <CardDescription>Performance evaluations and rankings</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          onClick={() => generateReport('performance')} 
                          className="w-full"
                          variant="outline"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Report
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Statistics</CardTitle>
                  <CardDescription>Overview of key metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{stats.totalCadets}</div>
                      <div className="text-sm text-muted-foreground">Total Cadets</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{stats.juniorPlatoon}</div>
                      <div className="text-sm text-muted-foreground">Junior Platoon</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.seniorPlatoon}</div>
                      <div className="text-sm text-muted-foreground">Senior Platoon</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{stats.recentJoins}</div>
                      <div className="text-sm text-muted-foreground">Recent Joins</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span>System Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-800">Database Connection</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-800">Authentication Service</span>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <span className="text-blue-800">Edge Functions</span>
                      <Badge className="bg-blue-100 text-blue-800">Operational</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;