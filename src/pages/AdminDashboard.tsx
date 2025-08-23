import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus, Shield } from "lucide-react";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [newCadet, setNewCadet] = useState({
    email: '',
    password: '',
    fullName: '',
    applicationNumber: '',
    dateOfBirth: '',
    platoon: 'Junior'
  });

  const handleCreateCadetAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, create the cadet record
      const { data: cadetData, error: cadetError } = await supabase
        .from('cadets')
        .insert({
          name_full: newCadet.fullName,
          name_with_initials: newCadet.fullName, // Admin can update this later
          application_number: newCadet.applicationNumber,
          date_of_birth: newCadet.dateOfBirth,
          platoon: newCadet.platoon,
        })
        .select()
        .single();

      if (cadetError) throw cadetError;

      // Then create the auth account
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newCadet.email,
        password: newCadet.password,
        email_confirm: true,
        user_metadata: {
          full_name: newCadet.fullName,
        },
      });

      if (authError) throw authError;

      // Finally, create the user profile linking to the cadet
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: newCadet.email,
          full_name: newCadet.fullName,
          role: 'student',
          cadet_id: cadetData.id,
        });

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: `Cadet account created successfully for ${newCadet.fullName}`,
      });

      // Reset form
      setNewCadet({
        email: '',
        password: '',
        fullName: '',
        applicationNumber: '',
        dateOfBirth: '',
        platoon: 'Junior'
      });

    } catch (error: any) {
      // Check if it's a duplicate application number error
      if (error.code === '23505' && error.message?.includes('cadets_application_number_key')) {
        toast({
          title: "Duplicate Application Number",
          description: `Application number "${newCadet.applicationNumber}" already exists. Please use a unique application number.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create cadet account",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cadets</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Active cadet records</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Junior Platoon</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Ages 12-14</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Senior Platoon</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Ages 14-20</p>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Create New Cadet Account</span>
                </CardTitle>
                <CardDescription>
                  Create login credentials for a new cadet and their basic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCadetAccount} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={newCadet.fullName}
                        onChange={(e) => setNewCadet({ ...newCadet, fullName: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="applicationNumber">Application Number *</Label>
                      <Input
                        id="applicationNumber"
                        value={newCadet.applicationNumber}
                        onChange={(e) => setNewCadet({ ...newCadet, applicationNumber: e.target.value })}
                        placeholder="APP001"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newCadet.email}
                        onChange={(e) => setNewCadet({ ...newCadet, email: e.target.value })}
                        placeholder="cadet@school.edu"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Temporary Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newCadet.password}
                        onChange={(e) => setNewCadet({ ...newCadet, password: e.target.value })}
                        placeholder="Temporary password for cadet"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newCadet.dateOfBirth}
                        onChange={(e) => setNewCadet({ ...newCadet, dateOfBirth: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="platoon">Platoon *</Label>
                      <select
                        id="platoon"
                        value={newCadet.platoon}
                        onChange={(e) => setNewCadet({ ...newCadet, platoon: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        required
                      >
                        <option value="Junior">Junior Platoon (Ages 12-14)</option>
                        <option value="Senior">Senior Platoon (Ages 14-20)</option>
                      </select>
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                    {isLoading ? "Creating Account..." : "Create Cadet Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="manage-cadets">
            <Card>
              <CardHeader>
                <CardTitle>Manage Cadets</CardTitle>
                <CardDescription>View and manage existing cadet records</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Cadet management interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Generate and view reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Reports interface coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;