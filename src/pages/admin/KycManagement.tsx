import { useEffect, useState } from 'react';
import { AdminService } from '@/services/AdminService';
import { KycProfile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Check, X, Clock, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function KycManagement() {
  const [pendingKyc, setPendingKyc] = useState<KycProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ open: boolean; userId: string; name: string }>({
    open: false,
    userId: '',
    name: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.getPendingKyc();
      setPendingKyc(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string, name: string) => {
    setProcessingId(userId);
    try {
      await AdminService.approveKyc(userId);
      toast({
        title: 'KYC Approved',
        description: `${name}'s KYC has been approved successfully.`,
      });
      await loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve KYC. Please try again.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason Required',
        description: 'Please provide a reason for rejection.',
      });
      return;
    }

    setProcessingId(rejectModal.userId);
    try {
      await AdminService.rejectKyc(rejectModal.userId, rejectReason);
      toast({
        title: 'KYC Rejected',
        description: `${rejectModal.name}'s KYC has been rejected.`,
      });
      setRejectModal({ open: false, userId: '', name: '' });
      setRejectReason('');
      await loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject KYC. Please try again.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">KYC Management</h1>
        <p className="text-muted-foreground">
          Review and process user identity verification requests
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
          <CardDescription>
            {pendingKyc.length} application(s) awaiting review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : pendingKyc.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No pending applications</p>
              <p className="text-sm">All KYC requests have been processed</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>DOB</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingKyc.map((kyc) => (
                  <TableRow key={kyc.id}>
                    <TableCell className="font-medium">{kyc.fullName}</TableCell>
                    <TableCell>{kyc.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{kyc.address}</TableCell>
                    <TableCell>{format(new Date(kyc.dateOfBirth), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {kyc.documents.length} file(s)
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Clock className="h-3 w-3" />
                        {format(new Date(kyc.submittedAt), 'MMM d, yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(kyc.userId, kyc.fullName)}
                          disabled={processingId === kyc.userId}
                        >
                          {processingId === kyc.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setRejectModal({
                            open: true,
                            userId: kyc.userId,
                            name: kyc.fullName,
                          })}
                          disabled={processingId === kyc.userId}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reject Modal */}
      <Dialog open={rejectModal.open} onOpenChange={(open) => {
        if (!open) {
          setRejectModal({ open: false, userId: '', name: '' });
          setRejectReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject KYC Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {rejectModal.name}'s application.
              This will be communicated to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Input
                id="reason"
                placeholder="e.g., Documents are unclear or expired"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRejectModal({ open: false, userId: '', name: '' });
                  setRejectReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={!rejectReason.trim() || processingId === rejectModal.userId}
              >
                {processingId === rejectModal.userId ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Reject Application
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
