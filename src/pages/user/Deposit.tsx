import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserService, DAILY_DEPOSIT_LIMIT } from '@/services/UserService';
import { useKycCheck } from '@/components/KycCheck';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DepositPage() {
  const { user, updateUser } = useAuth();
  const { isKycApproved } = useKycCheck();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const remainingLimit = DAILY_DEPOSIT_LIMIT - (user?.dailyDepositUsed || 0);
  const depositProgress = ((user?.dailyDepositUsed || 0) / DAILY_DEPOSIT_LIMIT) * 100;
  const depositToken = user?.bank === 'A' ? 'DA' : 'DB';

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isKycApproved) {
      toast({
        variant: 'destructive',
        title: 'KYC Required',
        description: 'Please complete KYC verification first.',
      });
      navigate('/user/kyc');
      return;
    }

    const depositAmount = parseFloat(amount);
    
    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount.',
      });
      return;
    }

    if (depositAmount > remainingLimit) {
      toast({
        variant: 'destructive',
        title: 'Limit Exceeded',
        description: `Daily deposit limit exceeded. Remaining: $${remainingLimit.toLocaleString()}`,
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await UserService.depositUSD(
        user!.id,
        depositAmount,
        user!.bank,
        user!.dailyDepositUsed
      );

      // Update user balances
      const newBalances = { ...user!.balances };
      newBalances.USD -= depositAmount;
      newBalances[result.token] += depositAmount;
      
      updateUser({
        balances: newBalances,
        dailyDepositUsed: user!.dailyDepositUsed + depositAmount,
      });

      toast({
        title: 'Deposit Successful',
        description: `Deposited $${depositAmount.toLocaleString()} → ${depositAmount.toLocaleString()} ${result.token}`,
      });

      setAmount('');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Deposit Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isKycApproved) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Deposit USD</h1>
          <p className="text-muted-foreground">Convert USD to tokenized deposits</p>
        </div>

        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">KYC Required</p>
                  <p className="text-sm text-muted-foreground">
                    Complete KYC verification to access deposit features.
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
        <h1 className="text-3xl font-bold">Deposit USD</h1>
        <p className="text-muted-foreground">
          Convert USD to tokenized deposits ({depositToken})
        </p>
      </div>

      {/* Daily Limit Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Daily Deposit Limit</CardTitle>
          <CardDescription>
            ${user?.dailyDepositUsed.toLocaleString()} of ${DAILY_DEPOSIT_LIMIT.toLocaleString()} used today
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={depositProgress} className="h-3" />
          <p className="mt-2 text-sm text-muted-foreground">
            Remaining: <span className="font-semibold">${remainingLimit.toLocaleString()}</span>
          </p>
        </CardContent>
      </Card>

      {/* Deposit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Make a Deposit</CardTitle>
          <CardDescription>
            Deposit USD from your account to receive {depositToken} tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDeposit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="10000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                  min={1}
                  max={remainingLimit}
                  disabled={isLoading}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Available USD balance: ${user?.balances.USD.toLocaleString()}
              </p>
            </div>

            {amount && parseFloat(amount) > 0 && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">You will receive:</p>
                <p className="text-2xl font-bold">
                  {parseFloat(amount).toLocaleString()} {depositToken}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Deposit
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
