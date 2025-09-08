import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, Plus, Edit, Trash2, Award, AlertTriangle, 
  GraduationCap, Calendar, Activity, FileText, 
  Heart, UserCheck, Plane, Trophy, BookOpen, Target
} from "lucide-react";

interface Cadet {
  id: string;
  name_full: string;
  name_with_initials: string;
  application_number: string;
  platoon: string;
  rank: string;
  age: number;
}

interface Achievement {
  id: string;
  achievement_type: string;
  achievement_description: string;
  date_achieved: string;
  camp_name: string;
  certificate_no: string;
}

interface DisciplinaryAction {
  id: string;
  date_of_action: string;
  offence: string;
  punishment: string;
}

interface EducationalQualification {
  id: string;
  exam_type: string;
  year: number;
  index_number: string;
  subject: string;
  grade: string;
}

interface TrainingCamp {
  id: string;
  camp_name: string;
  camp_level: string;
  location: string;
  duration_from: string;
  duration_to: string;
  remarks: string;
}

interface PerformanceEvaluation {
  id: string;
  evaluation_date: string;
  squad_drill: string;
  physical_training: string;
  assual: string;
  drama: string;
  presentation: string;
  regimental_duties: string;
  ncc_knowledge: string;
  first_aid: string;
}

interface AttendanceRecord {
  id: string;
  absent_dates: string;
  number_of_days: number;
  reason: string;
  excuse_letter_submitted: boolean;
  approval_status: boolean;
  eligibility?: boolean;
}

interface ExcuseLetterRecord {
  id: string;
  absent_dates: string;
  number_of_days: number;
  reason: string;
  approval_status: boolean;
  eligibility?: boolean;
}

interface EventParticipation {
  id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  role_task: string;
}

interface ForeignVisit {
  id: string;
  country: string;
  event_name: string;
  duration_from: string;
  duration_to: string;
  remarks: string;
}

interface MedicalRecord {
  id: string;
  issuance_party: string;
  date_of_issue: string;
  validity_end_date: string;
  medical_certificate_url: string;
}

interface TermEvaluation {
  id: string;
  term: string;
  subject: string;
  marks: number;
  total: number;
  position: number;
  average: number;
}

interface Promotion {
  id: string;
  from_rank: string;
  to_rank: string;
  promotion_type: string;
  effective_date: string;
}

const CadetManagement = () => {
  const { toast } = useToast();
  const [selectedCadet, setSelectedCadet] = useState<Cadet | null>(null);
  const [cadets, setCadets] = useState<Cadet[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Data states for different record types
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [disciplinaryActions, setDisciplinaryActions] = useState<DisciplinaryAction[]>([]);
  const [educationalQualifications, setEducationalQualifications] = useState<EducationalQualification[]>([]);
  const [trainingCamps, setTrainingCamps] = useState<TrainingCamp[]>([]);
  const [performanceEvaluations, setPerformanceEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [excuseLetters, setExcuseLetters] = useState<ExcuseLetterRecord[]>([]);
  const [eventParticipations, setEventParticipations] = useState<EventParticipation[]>([]);
  const [foreignVisits, setForeignVisits] = useState<ForeignVisit[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [termEvaluations, setTermEvaluations] = useState<TermEvaluation[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  // Form states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("achievements");
  const [newRecord, setNewRecord] = useState<any>({});

  useEffect(() => {
    fetchCadets();
  }, []);

  useEffect(() => {
    if (selectedCadet) {
      fetchCadetRecords();
    }
  }, [selectedCadet]);

  const fetchCadets = async () => {
    try {
      const { data, error } = await supabase
        .from('cadets')
        .select('id, name_full, name_with_initials, application_number, platoon, rank, age')
        .order('name_full');

      if (error) throw error;
      setCadets(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cadets: " + error.message,
        variant: "destructive",
      });
    }
  };

  const fetchCadetRecords = async () => {
    if (!selectedCadet) return;

    try {
      setIsLoading(true);
      
      // Fetch all record types for the selected cadet
      const [
        achievementsRes,
        disciplinaryRes,
        educationalRes,
        trainingRes,
        performanceRes,
        attendanceRes,
        excuseLettersRes,
        eventsRes,
        foreignRes,
        medicalRes,
        termRes,
        promotionsRes
      ] = await Promise.all([
        supabase.from('achievements').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('disciplinary_actions').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('educational_qualifications').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('training_camps').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('performance_evaluations').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('attendance_records').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('excuse_letters').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('events_participation').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('foreign_visits').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('medical_records').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('term_evaluations').select('*').eq('cadet_id', selectedCadet.id),
        supabase.from('promotions').select('*').eq('cadet_id', selectedCadet.id)
      ]);

      setAchievements(achievementsRes.data || []);
      setDisciplinaryActions(disciplinaryRes.data || []);
      setEducationalQualifications(educationalRes.data || []);
      setTrainingCamps(trainingRes.data || []);
      setPerformanceEvaluations(performanceRes.data || []);
      setAttendanceRecords(attendanceRes.data || []);
      setExcuseLetters(excuseLettersRes.data || []);
      setEventParticipations(eventsRes.data || []);
      setForeignVisits(foreignRes.data || []);
      setMedicalRecords(medicalRes.data || []);
      setTermEvaluations(termRes.data || []);
      setPromotions(promotionsRes.data || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch cadet records: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addRecord = async (tableName: 'achievements' | 'disciplinary_actions' | 'educational_qualifications' | 'training_camps', recordData: any) => {
    if (!selectedCadet) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from(tableName)
        .insert({ ...recordData, cadet_id: selectedCadet.id });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record added successfully",
      });

      setIsAddDialogOpen(false);
      setNewRecord({});
      fetchCadetRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add record: " + error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRecord = async (
    tableName: 'achievements' | 'disciplinary_actions' | 'educational_qualifications' | 'training_camps' | 'attendance_records' | 'excuse_letters',
    recordId: string
  ) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Record deleted successfully",
      });

      fetchCadetRecords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete record: " + error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCadets = cadets.filter(cadet =>
    cadet.name_full.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cadet.application_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRecordForm = () => {
    switch (activeTab) {
      case "achievements":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Achievement Type</Label>
              <Input
                value={newRecord.achievement_type || ''}
                onChange={(e) => setNewRecord({...newRecord, achievement_type: e.target.value})}
                placeholder="Certificate, Medal, Trophy, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Date Achieved</Label>
              <Input
                type="date"
                value={newRecord.date_achieved || ''}
                onChange={(e) => setNewRecord({...newRecord, date_achieved: e.target.value})}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Description</Label>
              <Textarea
                value={newRecord.achievement_description || ''}
                onChange={(e) => setNewRecord({...newRecord, achievement_description: e.target.value})}
                placeholder="Description of the achievement"
              />
            </div>
            <div className="space-y-2">
              <Label>Camp/Event Name</Label>
              <Input
                value={newRecord.camp_name || ''}
                onChange={(e) => setNewRecord({...newRecord, camp_name: e.target.value})}
                placeholder="Name of camp or event"
              />
            </div>
            <div className="space-y-2">
              <Label>Certificate Number</Label>
              <Input
                value={newRecord.certificate_no || ''}
                onChange={(e) => setNewRecord({...newRecord, certificate_no: e.target.value})}
                placeholder="Certificate number if applicable"
              />
            </div>
          </div>
        );

      case "disciplinary":
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date of Action</Label>
              <Input
                type="date"
                value={newRecord.date_of_action || ''}
                onChange={(e) => setNewRecord({...newRecord, date_of_action: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Offence</Label>
              <Input
                value={newRecord.offence || ''}
                onChange={(e) => setNewRecord({...newRecord, offence: e.target.value})}
                placeholder="Description of offence"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Punishment</Label>
              <Textarea
                value={newRecord.punishment || ''}
                onChange={(e) => setNewRecord({...newRecord, punishment: e.target.value})}
                placeholder="Punishment given"
              />
            </div>
          </div>
        );

      case "education":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Exam Type</Label>
              <Select
                value={newRecord.exam_type || ''}
                onValueChange={(value) => setNewRecord({...newRecord, exam_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exam type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GCE O/L">GCE O/L</SelectItem>
                  <SelectItem value="GCE A/L">GCE A/L</SelectItem>
                  <SelectItem value="1st term">1st term</SelectItem>
                  <SelectItem value="2nd term">2nd term</SelectItem>
                  <SelectItem value="3rd term">3rd term</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={newRecord.year || ''}
                onChange={(e) => setNewRecord({...newRecord, year: parseInt(e.target.value)})}
                placeholder="Exam year"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Index Number</Label>
              <Input
                value={newRecord.index_number || ''}
                onChange={(e) => setNewRecord({...newRecord, index_number: e.target.value})}
                placeholder="Index number"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Subjects & Grades</Label>
              {(newRecord.subjects || [{ subject: '', grade: '' }]).map((sg: { subject: string; grade: string }, idx: number) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <Input
                    value={sg.subject}
                    onChange={e => {
                      const updated = [...(newRecord.subjects || [])];
                      updated[idx].subject = e.target.value;
                      setNewRecord({ ...newRecord, subjects: updated });
                    }}
                    placeholder="Subject name"
                    className="w-1/2"
                  />
                  <Input
                    value={sg.grade}
                    onChange={e => {
                      const updated = [...(newRecord.subjects || [])];
                      updated[idx].grade = e.target.value;
                      setNewRecord({ ...newRecord, subjects: updated });
                    }}
                    placeholder="Grade"
                    className="w-1/2"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const updated = [...(newRecord.subjects || [])];
                      updated.splice(idx, 1);
                      setNewRecord({ ...newRecord, subjects: updated });
                    }}
                    className="text-destructive"
                  >Remove</Button>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setNewRecord({
                    ...newRecord,
                    subjects: [...(newRecord.subjects || []), { subject: '', grade: '' }],
                  });
                }}
              >Add Subject</Button>
            </div>
          </div>
        );

      case "training":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Camp Name</Label>
              <Input
                value={newRecord.camp_name || ''}
                onChange={(e) => setNewRecord({...newRecord, camp_name: e.target.value})}
                placeholder="Name of training camp"
              />
            </div>
            <div className="space-y-2">
              <Label>Camp Level</Label>
              <Select
                value={newRecord.camp_level || ''}
                onValueChange={(value) => setNewRecord({...newRecord, camp_level: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select camp level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">Company Level</SelectItem>
                  <SelectItem value="Battalion">Battalion Level</SelectItem>
                  <SelectItem value="Provincial">Provincial Level</SelectItem>
                  <SelectItem value="National">National Level</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input
                value={newRecord.location || ''}
                onChange={(e) => setNewRecord({...newRecord, location: e.target.value})}
                placeholder="Camp location"
              />
            </div>
            <div className="space-y-2">
              <Label>Duration From</Label>
              <Input
                type="date"
                value={newRecord.duration_from || ''}
                onChange={(e) => setNewRecord({...newRecord, duration_from: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Duration To</Label>
              <Input
                type="date"
                value={newRecord.duration_to || ''}
                onChange={(e) => setNewRecord({...newRecord, duration_to: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={newRecord.remarks || ''}
                onChange={(e) => setNewRecord({...newRecord, remarks: e.target.value})}
                placeholder="Additional remarks"
              />
            </div>
          </div>
        );

      default:
        return <div>Select a record type to add</div>;
    }
  };

  const renderRecordTable = () => {
    switch (activeTab) {
      case "achievements":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Camp/Event</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {achievements.map((achievement) => (
                <TableRow key={achievement.id}>
                  <TableCell>{achievement.achievement_type}</TableCell>
                  <TableCell>{achievement.achievement_description}</TableCell>
                  <TableCell>{achievement.date_achieved}</TableCell>
                  <TableCell>{achievement.camp_name}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('achievements', achievement.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "disciplinary":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Offence</TableHead>
                <TableHead>Punishment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disciplinaryActions.map((action) => (
                <TableRow key={action.id}>
                  <TableCell>{action.date_of_action}</TableCell>
                  <TableCell>{action.offence}</TableCell>
                  <TableCell>{action.punishment}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('disciplinary_actions', action.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "education":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Type</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {educationalQualifications.map((qual) => (
                <TableRow key={qual.id}>
                  <TableCell>{qual.exam_type}</TableCell>
                  <TableCell>{qual.year}</TableCell>
                  <TableCell>{qual.subject}</TableCell>
                  <TableCell>{qual.grade}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('educational_qualifications', qual.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      case "training":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Camp Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainingCamps.map((camp) => (
                <TableRow key={camp.id}>
                  <TableCell>{camp.camp_name}</TableCell>
                  <TableCell>{camp.camp_level}</TableCell>
                  <TableCell>{camp.location}</TableCell>
                  <TableCell>{camp.duration_from} to {camp.duration_to}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRecord('training_camps', camp.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );

      default:
        return <div>Select a record type to view</div>;
    }
  };

  return (
  
    <div className="space-y-6">
      {/* Cadet Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Cadet to Manage
          </CardTitle>
          <CardDescription>
            Choose a cadet to view and manage their additional records
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search by name or application number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Badge variant="secondary">{filteredCadets.length} cadets</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto">
              {filteredCadets.map((cadet) => (
                <Card
                  key={cadet.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCadet?.id === cadet.id ? 'ring-2 ring-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedCadet(cadet)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold">{cadet.name_full}</h4>
                      <div className="text-sm text-muted-foreground">
                        <p>App No: {cadet.application_number}</p>
                        <p>{cadet.platoon} - {cadet.rank || 'Cadet'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Cadet Records Management */}
      {selectedCadet && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <span>Managing: {selectedCadet.name_full}</span>
              <Badge variant="secondary" className="text-sm">
                App No: {selectedCadet.application_number}
              </Badge>
            </CardTitle>
            <CardDescription>
              Add and manage additional records for this cadet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="relative flex justify-center min-h-[110px]">
                <div className="absolute left-0 top-0 w-full h-full bg-muted rounded-lg z-0" />
                <TabsList
                  className="flex flex-wrap gap-1 px-0 py-2 min-h-[90px] sm:min-h-[60px] w-full max-w-full items-center relative z-10 justify-center"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <TabsTrigger value="achievements" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Award className="h-4 w-4" />
                    <span className="ml-1">Achievements</span>
                  </TabsTrigger>
                  <TabsTrigger value="disciplinary" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="ml-1">Disciplinary</span>
                  </TabsTrigger>
                  <TabsTrigger value="education" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <GraduationCap className="h-4 w-4" />
                    <span className="ml-1">Education</span>
                  </TabsTrigger>
                  <TabsTrigger value="training" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Target className="h-4 w-4" />
                    <span className="ml-1">Training</span>
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Activity className="h-4 w-4" />
                    <span className="ml-1">Performance</span>
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <UserCheck className="h-4 w-4" />
                    <span className="ml-1">Attendance</span>
                  </TabsTrigger>
                  <TabsTrigger value="excuse_letters" className="flex items-center gap-1 min-w-[120px] sm:min-w-[100px] px-2 py-1 justify-center text-sm">
                    <UserCheck className="h-4 w-4" />
                    <span className="ml-1">Excuse Letters</span>
                  </TabsTrigger>
                  <TabsTrigger value="events" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Calendar className="h-4 w-4" />
                    <span className="ml-1">Events</span>
                  </TabsTrigger>
                  <TabsTrigger value="medical" className="flex items-center gap-1 min-w-[90px] sm:min-w-[80px] px-2 py-1 justify-center text-sm">
                    <Heart className="h-4 w-4" />
                    <span className="ml-1">Medical</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              {/* Achievements Tab Content */}
              <TabsContent value="achievements" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Achievements & Awards</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('achievements'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                {renderRecordTable()}
              </TabsContent>
              <TabsContent value="disciplinary" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Disciplinary Actions</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('disciplinary'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                {renderRecordTable()}
              </TabsContent>
              <TabsContent value="education" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Educational Qualifications</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('education'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                {renderRecordTable()}
              </TabsContent>
              <TabsContent value="training" className="space-y-6 mt-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Training Camps</h2>
                  <Button variant="secondary" onClick={() => { setActiveTab('training'); setIsAddDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Record
                  </Button>
                </div>
                {renderRecordTable()}
              </TabsContent>
              {/* Add Record Dialog (rendered once, for the active tab, outside TabsContent) */}
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Record</DialogTitle>
                    <DialogDescription>Fill in the details below.</DialogDescription>
                  </DialogHeader>
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      if (activeTab === 'achievements') addRecord('achievements', newRecord);
                      else if (activeTab === 'disciplinary') addRecord('disciplinary_actions', newRecord);
                      else if (activeTab === 'education') addRecord('educational_qualifications', {
                        ...newRecord,
                        subject: (newRecord.subjects && newRecord.subjects.length > 0) ? newRecord.subjects.map(sg => sg.subject).join(', ') : '',
                        grade: (newRecord.subjects && newRecord.subjects.length > 0) ? newRecord.subjects.map(sg => sg.grade).join(', ') : '',
                      });
                      else if (activeTab === 'training') addRecord('training_camps', newRecord);
                    }}
                  >
                    {renderRecordForm()}
                    <div className="flex justify-end mt-4">
                      <Button type="submit">Save</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
              {/* Attendance Tab Content */}
              <TabsContent value="attendance" className="space-y-6 mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Number of Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Eligibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.absent_dates}</TableCell>
                        <TableCell>{record.number_of_days}</TableCell>
                        <TableCell>{record.reason}</TableCell>
                        <TableCell>{record.approval_status ? 'Approved' : 'Pending'}</TableCell>
                        <TableCell>{record.eligibility ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecord('attendance_records', record.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
              {/* Excuse Letters Tab Content */}
              <TabsContent value="excuse_letters" className="space-y-6 mt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Number of Days</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Eligibility</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(excuseLetters || []).map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.absent_dates}</TableCell>
                        <TableCell>{record.number_of_days}</TableCell>
                        <TableCell>{record.reason}</TableCell>
                        <TableCell>{record.approval_status ? 'Approved' : 'Pending'}</TableCell>
                        <TableCell>{record.eligibility ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteRecord('excuse_letters', record.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
export default CadetManagement;