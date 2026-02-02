import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import { KycProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function KycProfilePage() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [kycProfile, setKycProfile] = useState<KycProfile | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: user?.email || '',
    address: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    loadKycProfile();
  }, [user?.id]);

  const loadKycProfile = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const profile = await UserService.getKyc(user.id);
      if (profile) {
        setKycProfile(profile);
        setFormData({
          fullName: profile.fullName,
          email: profile.email,
          address: profile.address,
          dateOfBirth: profile.dateOfBirth,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const profile = await UserService.submitKyc(user.id, formData, files);
      setKycProfile(profile);
      updateUser({ kycStatus: 'pending' });
      toast({
        title: 'KYC Submitted',
        description: 'Your KYC application has been submitted for review.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit KYC. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = kycProfile?.status === 'approved';

  const getStatusBadge = () => {
    switch (kycProfile?.status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">KYC Profile</h1>
          <p className="text-muted-foreground">
            {isReadOnly 
              ? 'Your identity has been verified' 
              : 'Complete your identity verification'}
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {kycProfile?.status === 'rejected' && kycProfile.rejectionReason && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Application Rejected</p>
                <p className="text-sm text-muted-foreground">
                  Reason: {kycProfile.rejectionReason}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Please update your information and resubmit.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            {isReadOnly 
              ? 'Your verified information (read-only)'
              : 'Please provide accurate information that matches your documents'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="John Doe"
                  required
                  disabled={isReadOnly || isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                  disabled={isReadOnly || isSaving}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="123 Main St, City, State 12345"
                required
                disabled={isReadOnly || isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                required
                disabled={isReadOnly || isSaving}
              />
            </div>

            {!isReadOnly && (
              <div className="space-y-2">
                <Label htmlFor="documents">Supporting Documents</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload ID card, passport, or proof of address
                  </p>
                  <Input
                    id="documents"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFiles(e.target.files)}
                    className="max-w-xs mx-auto"
                    disabled={isSaving}
                  />
                </div>
                {files && files.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {files.length} file(s) selected
                  </p>
                )}
              </div>
            )}

            {kycProfile?.documents && kycProfile.documents.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Documents</Label>
                <div className="flex flex-wrap gap-2">
                  {kycProfile.documents.map((doc, i) => (
                    <Badge key={i} variant="outline">{doc}</Badge>
                  ))}
                </div>
              </div>
            )}

            {!isReadOnly && (
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit KYC Application'
                )}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
