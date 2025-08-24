import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, User, Heart, GraduationCap, Award, Shield, Users, FileText } from "lucide-react";

interface CadetRegistrationData {
  // Account & Basic Information
  email: string;
  password: string;
  fullName: string;
  nameWithInitials: string;
  applicationNumber: string;
  dateOfBirth: string;
  age: string;
  
  // Physical & Personal Details
  schoolAdmissionNo: string;
  regimentNo: string;
  rank: string;
  platoon: string;
  dateOfEnrollment: string;
  birthCertificateNo: string;
  nationalId: string;
  bloodGroup: string;
  heightCm: string;
  chestCm: string;
  photographUrl: string;
  skillsTalents: string;
  
  // Addresses
  permanentAddress: string;
  postalAddress: string;
  
  // Practice & Withdrawal Information
  dateJoinedPractices: string;
  dateLeftPractices: string;
  withdrawalLetterType: string;
  withdrawalDateFrom: string;
  withdrawalDateTo: string;
  withdrawalReason: string;
  withdrawalApproved: boolean;
  battalionInformed: boolean;
  battalionAcceptance: boolean;
  battalionAcceptanceDate: string;
  
  // Family Contacts
  fatherName: string;
  fatherOccupation: string;
  fatherContact: string;
  fatherWhatsapp: string;
  motherName: string;
  motherOccupation: string;
  motherContact: string;
  motherWhatsapp: string;
  guardianName: string;
  guardianContact: string;
  
  // Medical Information
  medicalCertificateUrl: string;
  medicalIssuanceParty: string;
  medicalDateOfIssue: string;
  medicalValidityEndDate: string;
  
  // Administrative
  masterRemarks: string;
  rectorRecommendations: string;
}

interface CadetRegistrationFormProps {
  onSuccess: () => void;
}

export const CadetRegistrationForm = ({ onSuccess }: CadetRegistrationFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  const [formData, setFormData] = useState<CadetRegistrationData>({
    // Account & Basic Information
    email: '',
    password: '',
    fullName: '',
    nameWithInitials: '',
    applicationNumber: '',
    dateOfBirth: '',
    age: '',
    
    // Physical & Personal Details
    schoolAdmissionNo: '',
    regimentNo: '',
    rank: 'Cadet',
    platoon: 'Junior',
    dateOfEnrollment: '',
    birthCertificateNo: '',
    nationalId: '',
    bloodGroup: '',
    heightCm: '',
    chestCm: '',
    photographUrl: '',
    skillsTalents: '',
    
    // Addresses
    permanentAddress: '',
    postalAddress: '',
    
    // Practice & Withdrawal Information
    dateJoinedPractices: '',
    dateLeftPractices: '',
    withdrawalLetterType: '',
    withdrawalDateFrom: '',
    withdrawalDateTo: '',
    withdrawalReason: '',
    withdrawalApproved: false,
    battalionInformed: false,
    battalionAcceptance: false,
    battalionAcceptanceDate: '',
    
    // Family Contacts
    fatherName: '',
    fatherOccupation: '',
    fatherContact: '',
    fatherWhatsapp: '',
    motherName: '',
    motherOccupation: '',
    motherContact: '',
    motherWhatsapp: '',
    guardianName: '',
    guardianContact: '',
    
    // Medical Information
    medicalCertificateUrl: '',
    medicalIssuanceParty: '',
    medicalDateOfIssue: '',
    medicalValidityEndDate: '',
    
    // Administrative
    masterRemarks: '',
    rectorRecommendations: '',
  });

  const updateFormData = (field: keyof CadetRegistrationData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const handleDateOfBirthChange = (dateOfBirth: string) => {
    updateFormData('dateOfBirth', dateOfBirth);
    updateFormData('age', calculateAge(dateOfBirth));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    // Required fields validation
    if (!formData.fullName) errors.push("Full Name is required");
    if (!formData.applicationNumber) errors.push("Application Number is required");
    if (!formData.dateOfBirth) errors.push("Date of Birth is required");
    if (!formData.email) errors.push("Email is required");
    if (!formData.password) errors.push("Password is required");
    
    // Age validation for platoon
    const age = parseInt(formData.age);
    if (formData.platoon === 'Junior' && (age < 12 || age >= 14)) {
      errors.push("Junior Platoon requires age between 12-14 years");
    }
    if (formData.platoon === 'Senior' && (age < 14 || age >= 20)) {
      errors.push("Senior Platoon requires age between 14-20 years");
    }
    
    // Physical requirements
    const height = parseInt(formData.heightCm);
    if (height && height < 150) {
      errors.push("Height must be at least 150cm");
    }
    
    const chest = parseInt(formData.chestCm);
    if (chest && chest < 75) {
      errors.push("Chest measurement must be at least 75cm (extended)");
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Create cadet record
      const { data: cadetData, error: cadetError } = await supabase
        .from('cadets')
        .insert({
          name_full: formData.fullName,
          name_with_initials: formData.nameWithInitials || formData.fullName,
          application_number: formData.applicationNumber,
          date_of_birth: formData.dateOfBirth,
          age: parseInt(formData.age) || null,
          school_admission_no: formData.schoolAdmissionNo || null,
          regiment_no: formData.regimentNo || null,
          rank: formData.rank,
          platoon: formData.platoon,
          date_of_enrollment: formData.dateOfEnrollment || null,
          birth_certificate_no: formData.birthCertificateNo || null,
          national_id: formData.nationalId || null,
          blood_group: formData.bloodGroup || null,
          height_cm: parseInt(formData.heightCm) || null,
          chest_cm: parseInt(formData.chestCm) || null,
          photograph_url: formData.photographUrl || null,
          skills_talents: formData.skillsTalents || null,
          permanent_address: formData.permanentAddress || null,
          postal_address: formData.postalAddress || null,
          date_joined_practices: formData.dateJoinedPractices || null,
          date_left_practices: formData.dateLeftPractices || null,
          withdrawal_letter_type: formData.withdrawalLetterType || null,
          withdrawal_date_from: formData.withdrawalDateFrom || null,
          withdrawal_date_to: formData.withdrawalDateTo || null,
          withdrawal_reason: formData.withdrawalReason || null,
          withdrawal_approved: formData.withdrawalApproved,
          battalion_informed: formData.battalionInformed,
          battalion_acceptance: formData.battalionAcceptance,
          battalion_acceptance_date: formData.battalionAcceptanceDate || null,
          master_remarks: formData.masterRemarks || null,
          rector_recommendations: formData.rectorRecommendations || null,
        })
        .select()
        .single();

      if (cadetError) throw cadetError;

      // Create family contacts record
      if (formData.fatherName || formData.motherName || formData.guardianName) {
        await supabase.from('family_contacts').insert({
          cadet_id: cadetData.id,
          father_name: formData.fatherName || null,
          father_occupation: formData.fatherOccupation || null,
          father_contact: formData.fatherContact || null,
          father_whatsapp: formData.fatherWhatsapp || null,
          mother_name: formData.motherName || null,
          mother_occupation: formData.motherOccupation || null,
          mother_contact: formData.motherContact || null,
          mother_whatsapp: formData.motherWhatsapp || null,
          guardian_name: formData.guardianName || null,
          guardian_contact: formData.guardianContact || null,
        });
      }

      // Create medical records if provided
      if (formData.medicalCertificateUrl || formData.medicalIssuanceParty) {
        await supabase.from('medical_records').insert({
          cadet_id: cadetData.id,
          medical_certificate_url: formData.medicalCertificateUrl || null,
          issuance_party: formData.medicalIssuanceParty || null,
          date_of_issue: formData.medicalDateOfIssue || null,
          validity_end_date: formData.medicalValidityEndDate || null,
        });
      }

      // Create auth account
      const { data: userData, error: userError } = await supabase.functions.invoke('create-cadet-user', {
        body: {
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          cadetId: cadetData.id,
        },
      });

      if (userError) throw userError;
      if (userData.error) throw new Error(userData.error);

      toast({
        title: "Success",
        description: `Cadet account created successfully for ${formData.fullName}`,
      });

      onSuccess();
    } catch (error: any) {
      if (error.code === '23505' && error.message?.includes('application_number')) {
        toast({
          title: "Duplicate Application Number",
          description: `Application number "${formData.applicationNumber}" already exists.`,
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Create New Cadet Account</span>
        </CardTitle>
        <CardDescription>
          Complete cadet registration with all required information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic" className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Basic Info</span>
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center space-x-1">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="family" className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Family</span>
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center space-x-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => updateFormData('fullName', e.target.value)}
                    placeholder="John Doe Smith"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nameWithInitials">Name with Initials</Label>
                  <Input
                    id="nameWithInitials"
                    value={formData.nameWithInitials}
                    onChange={(e) => updateFormData('nameWithInitials', e.target.value)}
                    placeholder="J. D. Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="applicationNumber">Application Number *</Label>
                  <Input
                    id="applicationNumber"
                    value={formData.applicationNumber}
                    onChange={(e) => updateFormData('applicationNumber', e.target.value)}
                    placeholder="APP001"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="cadet@school.edu"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Temporary password"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleDateOfBirthChange(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Age (calculated)</Label>
                  <Input
                    id="age"
                    value={formData.age}
                    placeholder="Calculated from date of birth"
                    readOnly
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platoon">Platoon *</Label>
                  <Select value={formData.platoon} onValueChange={(value) => updateFormData('platoon', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platoon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior">Junior Platoon (Ages 12-14)</SelectItem>
                      <SelectItem value="Senior">Senior Platoon (Ages 14-20)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Personal Details Tab */}
            <TabsContent value="personal" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolAdmissionNo">School Admission Number</Label>
                  <Input
                    id="schoolAdmissionNo"
                    value={formData.schoolAdmissionNo}
                    onChange={(e) => updateFormData('schoolAdmissionNo', e.target.value)}
                    placeholder="SCH001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="regimentNo">Regiment Number</Label>
                  <Input
                    id="regimentNo"
                    value={formData.regimentNo}
                    onChange={(e) => updateFormData('regimentNo', e.target.value)}
                    placeholder="XX/XX/X/XXX"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rank">Rank</Label>
                  <Select value={formData.rank} onValueChange={(value) => updateFormData('rank', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cadet">Cadet</SelectItem>
                      <SelectItem value="Junior Lance Corporal">Junior Lance Corporal</SelectItem>
                      <SelectItem value="Junior Corporal">Junior Corporal</SelectItem>
                      <SelectItem value="Junior Sergeant">Junior Sergeant</SelectItem>
                      <SelectItem value="Lance Corporal">Lance Corporal</SelectItem>
                      <SelectItem value="Corporal">Corporal</SelectItem>
                      <SelectItem value="Sergeant">Sergeant</SelectItem>
                      <SelectItem value="Staff Sergeant">Staff Sergeant</SelectItem>
                      <SelectItem value="WO II">WO II</SelectItem>
                      <SelectItem value="WO I">WO I</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfEnrollment">Date of Enrollment</Label>
                  <Input
                    id="dateOfEnrollment"
                    type="date"
                    value={formData.dateOfEnrollment}
                    onChange={(e) => updateFormData('dateOfEnrollment', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthCertificateNo">Birth Certificate Number</Label>
                  <Input
                    id="birthCertificateNo"
                    value={formData.birthCertificateNo}
                    onChange={(e) => updateFormData('birthCertificateNo', e.target.value)}
                    placeholder="BC12345678"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID / Postal ID</Label>
                  <Input
                    id="nationalId"
                    value={formData.nationalId}
                    onChange={(e) => updateFormData('nationalId', e.target.value)}
                    placeholder="123456789V"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select value={formData.bloodGroup} onValueChange={(value) => updateFormData('bloodGroup', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="heightCm">Height (cm) - Min 150cm</Label>
                  <Input
                    id="heightCm"
                    type="number"
                    value={formData.heightCm}
                    onChange={(e) => updateFormData('heightCm', e.target.value)}
                    placeholder="170"
                    min="150"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chestCm">Chest (cm) - Min 75cm extended</Label>
                  <Input
                    id="chestCm"
                    type="number"
                    value={formData.chestCm}
                    onChange={(e) => updateFormData('chestCm', e.target.value)}
                    placeholder="85"
                    min="75"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateJoinedPractices">Date Joined Practices</Label>
                  <Input
                    id="dateJoinedPractices"
                    type="date"
                    value={formData.dateJoinedPractices}
                    onChange={(e) => updateFormData('dateJoinedPractices', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateLeftPractices">Date Left Practices</Label>
                  <Input
                    id="dateLeftPractices"
                    type="date"
                    value={formData.dateLeftPractices}
                    onChange={(e) => updateFormData('dateLeftPractices', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawalLetterType">Withdrawal Letter Type</Label>
                  <Select value={formData.withdrawalLetterType} onValueChange={(value) => updateFormData('withdrawalLetterType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Permanent">Permanent</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="permanentAddress">Permanent Address</Label>
                  <Textarea
                    id="permanentAddress"
                    value={formData.permanentAddress}
                    onChange={(e) => updateFormData('permanentAddress', e.target.value)}
                    placeholder="Enter permanent address"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalAddress">Postal Address</Label>
                  <Textarea
                    id="postalAddress"
                    value={formData.postalAddress}
                    onChange={(e) => updateFormData('postalAddress', e.target.value)}
                    placeholder="Enter postal address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skillsTalents">Skills & Talents</Label>
                <Textarea
                  id="skillsTalents"
                  value={formData.skillsTalents}
                  onChange={(e) => updateFormData('skillsTalents', e.target.value)}
                  placeholder="List any special skills, talents, or abilities"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="withdrawalApproved"
                    checked={formData.withdrawalApproved}
                    onCheckedChange={(checked) => updateFormData('withdrawalApproved', !!checked)}
                  />
                  <Label htmlFor="withdrawalApproved">Withdrawal Approved</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="battalionInformed"
                    checked={formData.battalionInformed}
                    onCheckedChange={(checked) => updateFormData('battalionInformed', !!checked)}
                  />
                  <Label htmlFor="battalionInformed">Battalion Informed</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="battalionAcceptance"
                    checked={formData.battalionAcceptance}
                    onCheckedChange={(checked) => updateFormData('battalionAcceptance', !!checked)}
                  />
                  <Label htmlFor="battalionAcceptance">Battalion Acceptance</Label>
                </div>
              </div>
            </TabsContent>

            {/* Family & Medical Tab */}
            <TabsContent value="family" className="space-y-6">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Family Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName">Father's Name</Label>
                    <Input
                      id="fatherName"
                      value={formData.fatherName}
                      onChange={(e) => updateFormData('fatherName', e.target.value)}
                      placeholder="Father's full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fatherOccupation">Father's Occupation</Label>
                    <Input
                      id="fatherOccupation"
                      value={formData.fatherOccupation}
                      onChange={(e) => updateFormData('fatherOccupation', e.target.value)}
                      placeholder="Father's occupation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fatherContact">Father's Contact Number</Label>
                    <Input
                      id="fatherContact"
                      value={formData.fatherContact}
                      onChange={(e) => updateFormData('fatherContact', e.target.value)}
                      placeholder="+94771234567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fatherWhatsapp">Father's WhatsApp Number</Label>
                    <Input
                      id="fatherWhatsapp"
                      value={formData.fatherWhatsapp}
                      onChange={(e) => updateFormData('fatherWhatsapp', e.target.value)}
                      placeholder="+94771234567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="motherName">Mother's Name</Label>
                    <Input
                      id="motherName"
                      value={formData.motherName}
                      onChange={(e) => updateFormData('motherName', e.target.value)}
                      placeholder="Mother's full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="motherOccupation">Mother's Occupation</Label>
                    <Input
                      id="motherOccupation"
                      value={formData.motherOccupation}
                      onChange={(e) => updateFormData('motherOccupation', e.target.value)}
                      placeholder="Mother's occupation"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="motherContact">Mother's Contact Number</Label>
                    <Input
                      id="motherContact"
                      value={formData.motherContact}
                      onChange={(e) => updateFormData('motherContact', e.target.value)}
                      placeholder="+94771234567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="motherWhatsapp">Mother's WhatsApp Number</Label>
                    <Input
                      id="motherWhatsapp"
                      value={formData.motherWhatsapp}
                      onChange={(e) => updateFormData('motherWhatsapp', e.target.value)}
                      placeholder="+94771234567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian's Name</Label>
                    <Input
                      id="guardianName"
                      value={formData.guardianName}
                      onChange={(e) => updateFormData('guardianName', e.target.value)}
                      placeholder="Guardian's full name (if applicable)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="guardianContact">Guardian's Contact Number</Label>
                    <Input
                      id="guardianContact"
                      value={formData.guardianContact}
                      onChange={(e) => updateFormData('guardianContact', e.target.value)}
                      placeholder="+94771234567"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-semibold">Medical Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medicalIssuanceParty">Medical Certificate Issuing Party</Label>
                    <Select value={formData.medicalIssuanceParty} onValueChange={(value) => updateFormData('medicalIssuanceParty', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issuing party" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Government Hospital">Government Hospital</SelectItem>
                        <SelectItem value="Private Hospital">Private Hospital</SelectItem>
                        <SelectItem value="Private Clinic">Private Clinic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="medicalDateOfIssue">Medical Certificate Date of Issue</Label>
                    <Input
                      id="medicalDateOfIssue"
                      type="date"
                      value={formData.medicalDateOfIssue}
                      onChange={(e) => updateFormData('medicalDateOfIssue', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="medicalValidityEndDate">Medical Certificate Validity End Date</Label>
                    <Input
                      id="medicalValidityEndDate"
                      type="date"
                      value={formData.medicalValidityEndDate}
                      onChange={(e) => updateFormData('medicalValidityEndDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="medicalCertificateUrl">Medical Certificate URL</Label>
                    <Input
                      id="medicalCertificateUrl"
                      value={formData.medicalCertificateUrl}
                      onChange={(e) => updateFormData('medicalCertificateUrl', e.target.value)}
                      placeholder="URL to medical certificate document"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Administrative Tab */}
            <TabsContent value="admin" className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="masterRemarks">Master's Remarks for Final Certificate</Label>
                  <Textarea
                    id="masterRemarks"
                    value={formData.masterRemarks}
                    onChange={(e) => updateFormData('masterRemarks', e.target.value)}
                    placeholder="Master in charge remarks for the issuance of the final certificate"
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rectorRecommendations">Rector's/Principal's Recommendations</Label>
                  <Textarea
                    id="rectorRecommendations"
                    value={formData.rectorRecommendations}
                    onChange={(e) => updateFormData('rectorRecommendations', e.target.value)}
                    placeholder="Recommendations of the Rector/Principal to issue the final certificate"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalReason">Withdrawal Reason</Label>
                    <Textarea
                      id="withdrawalReason"
                      value={formData.withdrawalReason}
                      onChange={(e) => updateFormData('withdrawalReason', e.target.value)}
                      placeholder="Reason for withdrawal (if applicable)"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photographUrl">Photograph URL</Label>
                    <Input
                      id="photographUrl"
                      value={formData.photographUrl}
                      onChange={(e) => updateFormData('photographUrl', e.target.value)}
                      placeholder="URL to cadet's photograph"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalDateFrom">Withdrawal Date From</Label>
                    <Input
                      id="withdrawalDateFrom"
                      type="date"
                      value={formData.withdrawalDateFrom}
                      onChange={(e) => updateFormData('withdrawalDateFrom', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="withdrawalDateTo">Withdrawal Date To</Label>
                    <Input
                      id="withdrawalDateTo"
                      type="date"
                      value={formData.withdrawalDateTo}
                      onChange={(e) => updateFormData('withdrawalDateTo', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="battalionAcceptanceDate">Battalion Acceptance Date</Label>
                    <Input
                      id="battalionAcceptanceDate"
                      type="date"
                      value={formData.battalionAcceptanceDate}
                      onChange={(e) => updateFormData('battalionAcceptanceDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>Note:</strong> Additional records such as achievements, disciplinary actions, 
                    educational qualifications, training camps, performance evaluations, attendance records, 
                    and event participation can be added after the cadet account is created through the 
                    cadet management system.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-6 border-t">
            <div className="flex space-x-2">
              {activeTab !== "basic" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "personal", "family", "admin"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex > 0) {
                      setActiveTab(tabs[currentIndex - 1]);
                    }
                  }}
                >
                  Previous
                </Button>
              )}
              
              {activeTab !== "admin" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const tabs = ["basic", "personal", "family", "admin"];
                    const currentIndex = tabs.indexOf(activeTab);
                    if (currentIndex < tabs.length - 1) {
                      setActiveTab(tabs[currentIndex + 1]);
                    }
                  }}
                >
                  Next
                </Button>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="min-w-[200px]">
              {isLoading ? "Creating Account..." : "Create Cadet Account"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};