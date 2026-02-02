import { useEffect, useState } from 'react';
import { AdminService } from '@/services/AdminService';
import type { BankLimits as BankLimitsType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Building, DollarSign, Pencil, Loader2 } from 'lucide-react';

export default function BankLimits() {
  const [limits, setLimits] = useState<BankLimitsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [depositModal, setDepositModal] = useState(false);
  const [ledgerModal, setLedgerModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<'A' | 'B'>('A');
  const [newLimit, setNewLimit] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await AdminService.getBankLimits();
      setLimits(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDepositLimit = async () => {
    const limit = parseFloat(newLimit);
    
    if (isNaN(limit) || limit <= 0 || limit > 1000000) {
      toast({
        variant: 'destructive',
        title: 'Invalid Limit',
        description: 'Limit must be between 1 and 1,000,000',
      });
      return;
    }

    setIsSaving(true);
    try {
      await AdminService.setBankDepositLimit(selectedBank, limit);
      toast({
        title: 'Limit Updated',
        description: `Bank ${selectedBank} daily deposit limit set to $${limit.toLocaleString()}`,
      });
      setDepositModal(false);
      setNewLimit('');
      await loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update limit',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetLedgerLimit = async () => {
    const limit = parseFloat(newLimit);
    
    if (isNaN(limit) || limit <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Limit',
        description: 'Limit must be greater than 0',
      });
      return;
    }

    setIsSaving(true);
    try {
      await AdminService.setOffChainLedgerLimit(limit);
      toast({
        title: 'Limit Updated',
        description: `Off-chain ledger limit set to $${limit.toLocaleString()}`,
      });
      setLedgerModal(false);
      setNewLimit('');
      await loadData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update limit',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bank Limits</h1>
        <p className="text-muted-foreground">
          Configure deposit and transaction limits for the banking system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bank A Limit Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Bank A</CardTitle>
                  <CardDescription>Daily Deposit Limit</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedBank('A');
                  setNewLimit(limits?.bankA.dailyDepositLimit.toString() || '');
                  setDepositModal(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-3xl font-bold">
                ${limits?.bankA.dailyDepositLimit.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank B Limit Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/50">
                  <Building className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Bank B</CardTitle>
                  <CardDescription>Daily Deposit Limit</CardDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedBank('B');
                  setNewLimit(limits?.bankB.dailyDepositLimit.toString() || '');
                  setDepositModal(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-10 w-32" />
            ) : (
              <div className="text-3xl font-bold">
                ${limits?.bankB.dailyDepositLimit.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Off-Chain Ledger Limit */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent">
                <DollarSign className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">Off-Chain Ledger</CardTitle>
                <CardDescription>Maximum transaction limit for off-chain operations</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setNewLimit(limits?.offChainLedgerLimit.toString() || '');
                setLedgerModal(true);
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <div className="text-3xl font-bold">
              ${limits?.offChainLedgerLimit.toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Set Bank Deposit Limit Modal */}
      <Dialog open={depositModal} onOpenChange={(open) => {
        if (!open) {
          setDepositModal(false);
          setNewLimit('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Bank Deposit Limit</DialogTitle>
            <DialogDescription>
              Configure the daily deposit limit for the selected bank
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Bank</Label>
              <Select value={selectedBank} onValueChange={(v) => setSelectedBank(v as 'A' | 'B')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Bank A</SelectItem>
                  <SelectItem value="B">Bank B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Daily Limit (USD)</Label>
              <Input
                id="limit"
                type="number"
                placeholder="50000"
                min={1}
                max={1000000}
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be between $1 and $1,000,000
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDepositModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetDepositLimit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Limit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Off-Chain Ledger Limit Modal */}
      <Dialog open={ledgerModal} onOpenChange={(open) => {
        if (!open) {
          setLedgerModal(false);
          setNewLimit('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Off-Chain Ledger Limit</DialogTitle>
            <DialogDescription>
              Configure the maximum limit for off-chain ledger operations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="ledger-limit">Limit (USD)</Label>
              <Input
                id="ledger-limit"
                type="number"
                placeholder="1000000"
                min={1}
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setLedgerModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetLedgerLimit} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Limit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
