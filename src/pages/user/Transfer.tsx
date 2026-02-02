import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import { useKycCheck } from '@/components/KycCheck';
import { TokenType, Bank } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, AlertTriangle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TransferPage() {
  const { user, updateUser } = useAuth();
  const { isKycApproved } = useKycCheck();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Intra-bank state
  const [intraRecipient, setIntraRecipient] = useState('');
  const [intraAmount, setIntraAmount] = useState('');
  const [isIntraLoading, setIsIntraLoading] = useState(false);

  // Inter-bank state
  const [interBank, setInterBank] = useState<Bank | ''>('');
  const [interRecipient, setInterRecipient] = useState('');
  const [interAmount, setInterAmount] = useState('');
  const [isInterLoading, setIsInterLoading] = useState(false);

  const userDepositToken: TokenType = user?.bank === 'A' ? 'DA' : 'DB';
  const userDepositBalance = user?.bank === 'A' ? user.balances.DA : user?.balances.DB || 0;
  const csBalance = user?.balances.CS || 0;

  const handleIntraTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(intraAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
      });
      return;
    }

    if (amount > userDepositBalance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `You don't have enough ${userDepositToken}.`,
      });
      return;
    }

    setIsIntraLoading(true);
    try {
      await UserService.transfer(user!.id, {
        type: 'intra',
        token: userDepositToken,
        fromBank: user!.bank,
        toUserId: intraRecipient,
        amount,
      });

      // Update balances
      const newBalances = { ...user!.balances };
      newBalances[userDepositToken] -= amount;
      updateUser({ balances: newBalances });

      toast({
        title: 'Transfer Successful',
        description: `Transferred ${amount.toLocaleString()} ${userDepositToken} to ${intraRecipient}`,
      });

      setIntraRecipient('');
      setIntraAmount('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsIntraLoading(false);
    }
  };

  const handleInterTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(interAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
      });
      return;
    }

    if (amount > csBalance) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: "You don't have enough CS.",
      });
      return;
    }

    if (!interBank) {
      toast({
        variant: 'destructive',
        title: 'Select Destination Bank',
        description: 'Please select a destination bank.',
      });
      return;
    }

    setIsInterLoading(true);
    try {
      await UserService.transfer(user!.id, {
        type: 'inter',
        token: 'CS',
        fromBank: user!.bank,
        toBank: interBank as Bank,
        toUserId: interRecipient,
        amount,
      });

      // Update balances
      const newBalances = { ...user!.balances };
      newBalances.CS -= amount;
      updateUser({ balances: newBalances });

      toast({
        title: 'Transfer Successful',
        description: `Transferred ${amount.toLocaleString()} CS to Bank ${interBank} user ${interRecipient}`,
      });

      setInterBank('');
      setInterRecipient('');
      setInterAmount('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsInterLoading(false);
    }
  };

  if (!isKycApproved) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Transfer</h1>
          <p className="text-muted-foreground">Send tokens to other users</p>
        </div>

        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">KYC Required</p>
                  <p className="text-sm text-muted-foreground">
                    Complete KYC verification to access transfer features.
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/user/kyc')}>
                Complete KYC
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transfer</h1>
        <p className="text-muted-foreground">
          Send tokens to other users within or across banks
        </p>
      </div>

      <Tabs defaultValue="intra" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="intra">Intra-Bank Transfer</TabsTrigger>
          <TabsTrigger value="inter">Inter-Bank Transfer</TabsTrigger>
        </TabsList>

        {/* Intra-Bank Transfer */}
        <TabsContent value="intra">
          <Card>
            <CardHeader>
              <CardTitle>Intra-Bank Transfer</CardTitle>
              <CardDescription>
                Transfer {userDepositToken} to another user within Bank {user?.bank}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIntraTransfer} className="space-y-4">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your {userDepositToken} Balance</span>
                    <span className="font-semibold">{userDepositBalance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intra-recipient">Recipient (Email or ID)</Label>
                  <Input
                    id="intra-recipient"
                    placeholder="recipient@banka.com"
                    value={intraRecipient}
                    onChange={(e) => setIntraRecipient(e.target.value)}
                    required
                    disabled={isIntraLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be a user of Bank {user?.bank}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="intra-amount">Amount ({userDepositToken})</Label>
                  <Input
                    id="intra-amount"
                    type="number"
                    placeholder="1000"
                    value={intraAmount}
                    onChange={(e) => setIntraAmount(e.target.value)}
                    min={1}
                    max={userDepositBalance}
                    required
                    disabled={isIntraLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isIntraLoading || !intraRecipient || !intraAmount}
                >
                  {isIntraLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Transfer {userDepositToken}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inter-Bank Transfer */}
        <TabsContent value="inter">
          <Card>
            <CardHeader>
              <CardTitle>Inter-Bank Transfer</CardTitle>
              <CardDescription>
                Transfer CS (Consortium Stablecoin) to users at other banks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Inter-bank transfers use CS as the settlement token. Your CS will be burned, 
                    and the recipient's bank will mint their deposit token (DA/DB) for the recipient.
                  </p>
                </div>
              </div>

              <form onSubmit={handleInterTransfer} className="space-y-4">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Your CS Balance</span>
                    <span className="font-semibold">{csBalance.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Destination Bank</Label>
                  <Select value={interBank} onValueChange={(v) => setInterBank(v as Bank)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.bank !== 'A' && <SelectItem value="A">Bank A</SelectItem>}
                      {user?.bank !== 'B' && <SelectItem value="B">Bank B</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inter-recipient">Recipient (Email or ID)</Label>
                  <Input
                    id="inter-recipient"
                    placeholder="recipient@bankb.com"
                    value={interRecipient}
                    onChange={(e) => setInterRecipient(e.target.value)}
                    required
                    disabled={isInterLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inter-amount">Amount (CS)</Label>
                  <Input
                    id="inter-amount"
                    type="number"
                    placeholder="1000"
                    value={interAmount}
                    onChange={(e) => setInterAmount(e.target.value)}
                    min={1}
                    max={csBalance}
                    required
                    disabled={isInterLoading}
                  />
                </div>

                {interAmount && parseFloat(interAmount) > 0 && interBank && (
                  <div className="p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Recipient will receive:</p>
                    <p className="text-xl font-bold">
                      {parseFloat(interAmount).toLocaleString()} D{interBank}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      (Minted by Bank {interBank})
                    </p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isInterLoading || !interBank || !interRecipient || !interAmount || csBalance === 0}
                >
                  {isInterLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Transfer CS
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
