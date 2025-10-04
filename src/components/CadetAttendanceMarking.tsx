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
  attendance_status: string;
  marked_at: string;
}
const CadetAttendanceMarking = ({ onAttendanceMarked }: { onAttendanceMarked?: () => void }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [myAttendance, setMyAttendance] = useState<Record<string, MyAttendance>>({});
  const [attendanceForm, setAttendanceForm] = useState<Record<string, { entry_time: string; exit_time: string }>>({});
  const [cadetIdError, setCadetIdError] = useState<string | null>(null);

  // Excuse letter state
  const [excuseDialogSessionId, setExcuseDialogSessionId] = useState<string | null>(null);
  const [excuseText, setExcuseText] = useState<string>('');
  const [excuseSubmitting, setExcuseSubmitting] = useState(false);

  useEffect(() => {
    fetchPracticeSessions();
    fetchMyAttendance();
  }, []);

  const fetchPracticeSessions = async () => {
    try {
      // Fetch all sessions for the current term (remove date filter)
      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
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
      let cadetId = user?.cadet_id;
      if (!cadetId) {
        const { data: rpcCadetId } = await supabase.rpc('current_cadet_id');
        cadetId = rpcCadetId as string;
      }

      if (!cadetId) {
        throw new Error("Could not determine cadet ID");
      }

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
        .eq('cadet_id', cadetId);


      if (error) {
        setCadetIdError("Your cadet profile is not linked. Attendance marking is disabled. Please contact an administrator.");
        setMyAttendance({});
        return;
      }
      const attendanceMap: Record<string, MyAttendance> = {};
      data?.forEach(record => {
        let participation_minutes = 0;
        let attendance_percentage = 0;
        if (record.entry_time && record.exit_time) {
          const [eh, em] = String(record.exit_time).split(":").map(Number);
          const [sh, sm] = String(record.entry_time).split(":").map(Number);
          participation_minutes = (eh * 60 + em) - (sh * 60 + sm);
          if (participation_minutes < 0) participation_minutes = 0;
          // Find the session duration
          const session = sessions.find(s => s.id === record.practice_session_id);
          if (session && session.duration_minutes > 0) {
            attendance_percentage = (participation_minutes / session.duration_minutes) * 100;
            if (attendance_percentage < 0) attendance_percentage = 0;
            if (attendance_percentage > 100) attendance_percentage = 100;
          }
        }
        attendanceMap[record.practice_session_id] = {
          ...record,
          participation_minutes,
          attendance_percentage,
        };
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
      let cadetId = user?.cadet_id;
      if (!cadetId) {
        const { data: rpcCadetId } = await supabase.rpc('current_cadet_id');
        cadetId = (rpcCadetId as string | null | undefined) || undefined;
      }

  // First, upsert entry/exit time
  const upsertData = {
    practice_session_id: sessionId,
    cadet_id: cadetId,
    ...(type === 'entry' ? { entry_time: currentTime } : { exit_time: currentTime })
  };
  const { error: upsertError } = await supabase
  .from('cadet_attendance')
  .upsert([upsertData], { onConflict: 'practice_session_id,cadet_id' });
      if (upsertError) throw upsertError;

      // Fetch session duration and entry/exit times to recalculate attendance_percentage
      const { data: sessionData } = await supabase
        .from('practice_sessions')
        .select('duration_minutes')
        .eq('id', sessionId)
        .single();
      const { data: attendanceData } = await supabase
        .from('cadet_attendance')
        .select('id, entry_time, exit_time')
        .eq('practice_session_id', sessionId)
        .eq('cadet_id', cadetId)
        .single();
      let attendance_percentage = 0;
      if (attendanceData?.entry_time && attendanceData?.exit_time && sessionData?.duration_minutes > 0) {
        const [eh, em] = attendanceData.exit_time.split(":").map(Number);
        const [sh, sm] = attendanceData.entry_time.split(":").map(Number);
        const participation_minutes = (eh * 60 + em) - (sh * 60 + sm);
        attendance_percentage = (participation_minutes / sessionData.duration_minutes) * 100;
        if (attendance_percentage < 0) attendance_percentage = 0;
        if (attendance_percentage > 100) attendance_percentage = 100;
      }
      // Update attendance_percentage in the record
      await supabase
        .from('cadet_attendance')
        .update({ attendance_percentage })
        .eq('practice_session_id', sessionId)
        .eq('cadet_id', cadetId);

      if (onAttendanceMarked) onAttendanceMarked();
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
        let cadetId = user?.cadet_id;
        if (!cadetId) {
          const { data: rpcCadetId } = await supabase.rpc('current_cadet_id');
          cadetId = (rpcCadetId as string | null | undefined) || undefined;
        }

        const insertPayload = {
          practice_session_id: sessionId,
          entry_time: form.entry_time,
          exit_time: form.exit_time,
          ...(cadetId ? { cadet_id: cadetId } : {})
        } as any;

        const { error } = await supabase
          .from('cadet_attendance')
          .insert(insertPayload);

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
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <Calendar className="h-8 w-8" />
              <p>No upcoming practice sessions scheduled.</p>
              <p className="text-sm">Check back later for new sessions.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sessions.map((session) => {
                const attendance = myAttendance[session.id];
                const form = attendanceForm[session.id] || { entry_time: '', exit_time: '' };
                // Only allow marking for today and future sessions
                const sessionDate = new Date(session.practice_date);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const isPastSession = sessionDate < now;
                
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

                        {/* Info Notice - Attendance is marked by admin */}
                        {!isPastSession && (
                          <div className="lg:w-80 space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                              <h4 className="font-medium mb-2 text-sm">Attendance Information</h4>
                              <p className="text-xs text-muted-foreground">
                                Your attendance is marked by administrators. Check back after the session to view your attendance record.
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => {
                                setExcuseDialogSessionId(session.id);
                                setExcuseText('');
                              }}
                              disabled={isLoading}
                            >
                              Submit Excuse Letter
                            </Button>
                          </div>
                        )}
                        
                        {/* Show attendance marked message for past sessions */}
                        {isPastSession && !attendance && (
                          <div className="lg:w-80">
                            <div className="bg-muted p-4 rounded-lg">
                              <p className="text-xs text-muted-foreground">
                                This session has ended. {attendance ? 'Your attendance record is displayed above.' : 'No attendance record found for this session.'}
                              </p>
                            </div>
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
              {Object.entries(myAttendance).map(([sessionId, attendance]) => {
                const session = sessions.find(s => s.id === sessionId);
                if (!session) return null;
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

      {/* Excuse Letter Submission Dialog (Hidden) */}
      <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none" style={{ display: excuseDialogSessionId ? 'flex' : 'none' }}>
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full pointer-events-auto">
          <h4 className="text-lg font-semibold mb-4">Submit Excuse Letter</h4>
          <div className="mb-4">
            <Label htmlFor="excuse-text" className="block text-sm font-medium mb-2">Reason for Absence</Label>
            <textarea
              id="excuse-text"
              value={excuseText}
              onChange={(e) => setExcuseText(e.target.value)}
              placeholder="Enter your reason for absence"
              className="w-full border rounded p-2 min-h-[80px] text-sm"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setExcuseDialogSessionId(null)}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!excuseDialogSessionId || !excuseText.trim()) return;
                setExcuseSubmitting(true);
                try {
                  let cadetId = user?.cadet_id;
                  if (!cadetId) {
                    const { data: rpcCadetId } = await supabase.rpc('current_cadet_id');
                    cadetId = rpcCadetId as string;
                  }
                  // Find session date
                  const session = sessions.find(s => s.id === excuseDialogSessionId);
                  const absentDate = session?.practice_date;
                  // Insert into excuse_letters table
                  const { error } = await supabase
                    .from('excuse_letters')
                    .insert([{
                      cadet_id: cadetId,
                      absent_dates: absentDate,
                      reason: excuseText,
                      number_of_days: 1,
                      approval_status: false,
                      eligibility: false
                    }]);
                  if (error) throw error;
                  toast({ title: 'Success', description: 'Excuse letter submitted.' });
                  setExcuseDialogSessionId(null);
                  setExcuseText('');
                  fetchMyAttendance();
                } catch (error: any) {
                  toast({ title: 'Error', description: error.message || 'Failed to submit excuse letter', variant: 'destructive' });
                } finally {
                  setExcuseSubmitting(false);
                }
              }}
              disabled={excuseSubmitting}
              className="text-sm"
            >
              {excuseSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadetAttendanceMarking;