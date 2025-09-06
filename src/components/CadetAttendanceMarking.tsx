import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, Clock, Timer, CheckCircle, AlertCircle, 
  XCircle, LogIn, LogOut, Users
} from "lucide-react";
import { format } from "date-fns";

interface PracticeSession {
  id: string;
  title: string;
  description: string;
  practice_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
}

interface MyAttendance {
  id: string;
  entry_time: string;
  exit_time: string;
  participation_minutes: number;
  attendance_percentage: number;
  attendance_status: 'present' | 'leave_early' | 'absent';
  marked_at: string;
}

const CadetAttendanceMarking = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [myAttendance, setMyAttendance] = useState<Record<string, MyAttendance>>({});
  const [attendanceForm, setAttendanceForm] = useState<Record<string, { entry_time: string; exit_time: string }>>({});

  useEffect(() => {
    fetchPracticeSessions();
    fetchMyAttendance();
  }, []);

  const fetchPracticeSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .gte('practice_date', new Date().toISOString().split('T')[0]) // Only future and today's sessions
        .order('practice_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch practice sessions: " + error.message,
        variant: "destructive",
      });
    }
  };

  const fetchMyAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('cadet_attendance')
        .select(`
          id,
          practice_session_id,
          entry_time,
          exit_time,
          participation_minutes,
          attendance_percentage,
          attendance_status,
          marked_at
        `)
        .eq('cadet_id', user?.cadet_id);

      if (error) throw error;

      const attendanceMap: Record<string, MyAttendance> = {};
      data?.forEach(record => {
        attendanceMap[record.practice_session_id] = record;
      });
      setMyAttendance(attendanceMap);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance records: " + error.message,
        variant: "destructive",
      });
    }
  };

  const markAttendance = async (sessionId: string, type: 'entry' | 'exit') => {
    const currentTime = new Date().toLocaleTimeString('en-GB', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    setIsLoading(true);
    try {
      const existingAttendance = myAttendance[sessionId];
      
      if (existingAttendance) {
        // Update existing record
        const updateData = type === 'entry' 
          ? { entry_time: currentTime }
          : { exit_time: currentTime };

        const { error } = await supabase
          .from('cadet_attendance')
          .update(updateData)
          .eq('id', existingAttendance.id);

        if (error) throw error;
      } else {
        // Create new record
        const insertData = {
          practice_session_id: sessionId,
          cadet_id: user?.cadet_id,
          [type === 'entry' ? 'entry_time' : 'exit_time']: currentTime
        };

        const { error } = await supabase
          .from('cadet_attendance')
          .insert(insertData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `${type === 'entry' ? 'Entry' : 'Exit'} time marked successfully`,
      });

      fetchMyAttendance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to mark ${type} time: ` + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const manualMarkAttendance = async (sessionId: string) => {
    const form = attendanceForm[sessionId];
    if (!form?.entry_time || !form?.exit_time) {
      toast({
        title: "Validation Error",
        description: "Please enter both entry and exit times",
        variant: "destructive",
      });
      return;
    }

    if (form.entry_time >= form.exit_time) {
      toast({
        title: "Validation Error",
        description: "Exit time must be after entry time",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const existingAttendance = myAttendance[sessionId];
      
      if (existingAttendance) {
        // Update existing record
        const { error } = await supabase
          .from('cadet_attendance')
          .update({
            entry_time: form.entry_time,
            exit_time: form.exit_time
          })
          .eq('id', existingAttendance.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('cadet_attendance')
          .insert({
            practice_session_id: sessionId,
            cadet_id: user?.cadet_id,
            entry_time: form.entry_time,
            exit_time: form.exit_time
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Attendance marked successfully",
      });

      // Clear form
      setAttendanceForm(prev => ({
        ...prev,
        [sessionId]: { entry_time: '', exit_time: '' }
      }));
      
      fetchMyAttendance();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark attendance: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'leave_early':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Timer className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Present</Badge>;
      case 'leave_early':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Left Early</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Absent</Badge>;
      default:
        return <Badge variant="secondary">Not Marked</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Practice Sessions & Attendance
          </CardTitle>
          <CardDescription>
            Mark your attendance for scheduled practice sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming practice sessions scheduled.
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => {
                const attendance = myAttendance[session.id];
                const form = attendanceForm[session.id] || { entry_time: '', exit_time: '' };
                const isPastSession = new Date(session.practice_date) < new Date();
                
                return (
                  <Card key={session.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row justify-between gap-6">
                        {/* Session Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold">{session.title}</h3>
                            {attendance && (
                              <div className="flex items-center gap-2">
                                {getStatusIcon(attendance.attendance_status)}
                                {getStatusBadge(attendance.attendance_status)}
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{format(new Date(session.practice_date), 'PPP')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>{session.start_time} - {session.end_time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Timer className="h-4 w-4 text-muted-foreground" />
                              <span>{session.duration_minutes} minutes</span>
                            </div>
                          </div>
                          
                          {session.description && (
                            <p className="text-sm text-muted-foreground">{session.description}</p>
                          )}
                          
                          {attendance && (
                            <div className="bg-muted p-3 rounded-lg">
                              <h4 className="font-medium mb-2">Your Attendance</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Entry:</span>
                                  <p className="font-medium">{attendance.entry_time || 'Not marked'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Exit:</span>
                                  <p className="font-medium">{attendance.exit_time || 'Not marked'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Duration:</span>
                                  <p className="font-medium">{attendance.participation_minutes} min</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Percentage:</span>
                                  <p className="font-medium">{attendance.attendance_percentage.toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Attendance Marking */}
                        {!isPastSession && (
                          <div className="lg:w-80 space-y-4">
                            <h4 className="font-medium">Mark Attendance</h4>
                            
                            {/* Quick Mark Buttons */}
                            <div className="flex gap-2">
                              <Button
                                onClick={() => markAttendance(session.id, 'entry')}
                                disabled={isLoading}
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <LogIn className="h-4 w-4" />
                                Mark Entry
                              </Button>
                              <Button
                                onClick={() => markAttendance(session.id, 'exit')}
                                disabled={isLoading || !attendance?.entry_time}
                                size="sm"
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <LogOut className="h-4 w-4" />
                                Mark Exit
                              </Button>
                            </div>
                            
                            <div className="text-xs text-muted-foreground">
                              Or enter times manually:
                            </div>
                            
                            {/* Manual Time Entry */}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label htmlFor={`entry-${session.id}`} className="text-xs">Entry Time</Label>
                                <Input
                                  id={`entry-${session.id}`}
                                  type="time"
                                  value={form.entry_time}
                                  onChange={(e) => setAttendanceForm(prev => ({
                                    ...prev,
                                    [session.id]: { ...form, entry_time: e.target.value }
                                  }))}
                                  className="text-sm"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`exit-${session.id}`} className="text-xs">Exit Time</Label>
                                <Input
                                  id={`exit-${session.id}`}
                                  type="time"
                                  value={form.exit_time}
                                  onChange={(e) => setAttendanceForm(prev => ({
                                    ...prev,
                                    [session.id]: { ...form, exit_time: e.target.value }
                                  }))}
                                  className="text-sm"
                                />
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => manualMarkAttendance(session.id)}
                              disabled={isLoading || !form.entry_time || !form.exit_time}
                              size="sm"
                              className="w-full"
                            >
                              {isLoading ? "Marking..." : "Submit Attendance"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            My Attendance History
          </CardTitle>
          <CardDescription>
            View your past attendance records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(myAttendance).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.filter(session => myAttendance[session.id]).map((session) => {
                const attendance = myAttendance[session.id];
                return (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-semibold">{session.title}</h4>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(session.practice_date), 'PPP')} • 
                          {session.start_time} - {session.end_time}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(attendance.attendance_status)}
                        {getStatusBadge(attendance.attendance_status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Entry:</span>
                        <p className="font-medium">{attendance.entry_time || 'Not marked'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Exit:</span>
                        <p className="font-medium">{attendance.exit_time || 'Not marked'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <p className="font-medium">{attendance.participation_minutes} min</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Attendance:</span>
                        <p className="font-medium">{attendance.attendance_percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CadetAttendanceMarking;