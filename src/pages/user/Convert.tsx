import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserService, CONVERSION_CAP } from '@/services/UserService';
import { useKycCheck } from '@/components/KycCheck';
import { CurrencyType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, ArrowLeftRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STEPS = ['Select From', 'Select To', 'Enter Amount'];

export default function ConvertPage() {
  const { user, updateUser } = useAuth();
  const { isKycApproved } = useKycCheck();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(0);
  const [fromCurrency, setFromCurrency] = useState<CurrencyType | ''>('');
  const [toCurrency, setToCurrency] = useState<CurrencyType | ''>('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const depositToken = user?.bank === 'A' ? 'DA' : 'DB';

  const getAvailableToCurrencies = (): CurrencyType[] => {
    switch (fromCurrency) {
      case 'USD':
        return ['DA', 'DB'];
      case 'DA':
      case 'DB':
        return ['CS'];
      case 'CS':
        return ['USD', 'DA', 'DB'];
      default:
        return [];
    }
  };

  const getBalance = (currency: CurrencyType): number => {
    return user?.balances[currency] || 0;
  };

  const handleConvert = async () => {
    if (!fromCurrency || !toCurrency) return;
    
    const convertAmount = parseFloat(amount);
    
    if (isNaN(convertAmount) || convertAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid amount.',
      });
      return;
    }

    if (convertAmount > CONVERSION_CAP) {
      toast({
        variant: 'destructive',
        title: 'Conversion Cap Exceeded',
        description: `Maximum conversion per transaction is $${CONVERSION_CAP.toLocaleString()}`,
      });
      return;
    }

    if (convertAmount > getBalance(fromCurrency)) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Balance',
        description: `You don't have enough ${fromCurrency}.`,
      });
      return;
    }

    setIsLoading(true);
    try {
      await UserService.convert(user!.id, {
        from: fromCurrency,
        to: toCurrency,
        amount: convertAmount,
      });

      // Update balances
      const newBalances = { ...user!.balances };
      newBalances[fromCurrency] -= convertAmount;
      newBalances[toCurrency] += convertAmount;
      
      updateUser({ balances: newBalances });

      setIsComplete(true);
      toast({
        title: 'Conversion Successful',
        description: `Converted ${convertAmount.toLocaleString()} ${fromCurrency} → ${convertAmount.toLocaleString()} ${toCurrency}`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Conversion Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetWizard = () => {
    setStep(0);
    setFromCurrency('');
    setToCurrency('');
    setAmount('');
    setIsComplete(false);
  };

  if (!isKycApproved) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Convert Tokens</h1>
          <p className="text-muted-foreground">Exchange between currencies</p>
        </div>

        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">KYC Required</p>
                  <p className="text-sm text-muted-foreground">
                    Complete KYC verification to access conversion features.
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

  if (isComplete) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Convert Tokens</h1>
          <p className="text-muted-foreground">Exchange between currencies</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold mb-2">Conversion Complete!</h2>
              <p className="text-muted-foreground mb-6">
                Successfully converted {parseFloat(amount).toLocaleString()} {fromCurrency} to {toCurrency}
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={resetWizard}>
                  Make Another Conversion
                </Button>
                <Button variant="outline" onClick={() => navigate('/user/history')}>
                  View History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Convert Tokens</h1>
        <p className="text-muted-foreground">
          Exchange between currencies (max ${CONVERSION_CAP.toLocaleString()} per transaction)
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {STEPS.map((stepName, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i <= step
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <span className={`ml-2 text-sm ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>
              {stepName}
            </span>
            {i < STEPS.length - 1 && (
              <ArrowRight className="mx-4 h-4 w-4 text-muted-foreground" />
            )}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
          <CardDescription>
            {step === 0 && 'Choose the currency you want to convert from'}
            {step === 1 && 'Choose the currency you want to receive'}
            {step === 2 && 'Enter the amount to convert'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Select From Currency */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>From Currency</Label>
                <Select value={fromCurrency} onValueChange={(v) => setFromCurrency(v as CurrencyType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD (${user?.balances.USD.toLocaleString()})</SelectItem>
                    <SelectItem value="DA">DA ({user?.balances.DA.toLocaleString()})</SelectItem>
                    <SelectItem value="DB">DB ({user?.balances.DB.toLocaleString()})</SelectItem>
                    <SelectItem value="CS">CS ({user?.balances.CS.toLocaleString()})</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                disabled={!fromCurrency}
                onClick={() => setStep(1)}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Select To Currency */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">From</p>
                <p className="font-semibold">{fromCurrency} ({getBalance(fromCurrency as CurrencyType).toLocaleString()})</p>
              </div>
              
              <div className="space-y-2">
                <Label>To Currency</Label>
                <Select value={toCurrency} onValueChange={(v) => setToCurrency(v as CurrencyType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableToCurrencies().map((c) => (
                      <SelectItem key={c} value={c}>
                        {c} ({user?.balances[c].toLocaleString()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={!toCurrency}
                  onClick={() => setStep(2)}
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Enter Amount */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4 p-4 rounded-lg bg-muted">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-semibold text-lg">{fromCurrency}</p>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-semibold text-lg">{toCurrency}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={1}
                  max={Math.min(CONVERSION_CAP, getBalance(fromCurrency as CurrencyType))}
                  disabled={isLoading}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Available: {getBalance(fromCurrency as CurrencyType).toLocaleString()}</span>
                  <span>Max per tx: {CONVERSION_CAP.toLocaleString()}</span>
                </div>
              </div>

              {amount && parseFloat(amount) > 0 && (
                <div className="p-4 rounded-lg border">
                  <p className="text-sm text-muted-foreground">You will receive:</p>
                  <p className="text-2xl font-bold">
                    {parseFloat(amount).toLocaleString()} {toCurrency}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={isLoading || !amount || parseFloat(amount) <= 0}
                  onClick={handleConvert}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowLeftRight className="mr-2 h-4 w-4" />
                      Convert
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
