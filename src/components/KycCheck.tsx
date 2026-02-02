import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

interface KycCheckProps {
  children: React.ReactNode;
  action: string;
}

export function KycCheck({ children, action }: KycCheckProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const isKycApproved = user?.kycStatus === 'approved';

  const handleClick = (e: React.MouseEvent) => {
    if (!isKycApproved) {
      e.preventDefault();
      e.stopPropagation();
      setShowModal(true);
    }
  };

  return (
    <>
      <div onClick={handleClick}>
        {children}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <DialogTitle>KYC Required</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              You must complete KYC verification before you can {action}. 
              Please submit your KYC documents for approval.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              setShowModal(false);
              navigate('/user/kyc');
            }}>
              Complete KYC
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function useKycCheck() {
  const { user } = useAuth();
  return {
    isKycApproved: user?.kycStatus === 'approved',
    kycStatus: user?.kycStatus,
  };
}
