import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ArrowLeftRight,
  Send,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

export default function UserDashboard() {
  const { user } = useAuth();

  const getKycStatusCard = () => {
    switch (user?.kycStatus) {
      case 'approved':
        return (
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-200">KYC Verified</p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Your identity has been verified. You have full access to all features.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'pending':
        return (
          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800 dark:text-yellow-200">KYC Under Review</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Your application is being reviewed. This usually takes 1-2 business days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                  <div>
                    <p className="font-semibold text-destructive">KYC Required</p>
                    <p className="text-sm text-muted-foreground">
                      Complete KYC verification to access deposit, convert, and transfer features.
                    </p>
                  </div>
                </div>
                <Link to="/user/kyc">
                  <Button>Complete KYC</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">
          Manage your tokenized deposits and transactions
        </p>
      </div>

      {/* KYC Status */}
      {getKycStatusCard()}

      {/* Balances */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>USD Balance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${user?.balances.USD.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              Deposit Token (D{user?.bank})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.bank === 'A' 
                ? user?.balances.DA.toLocaleString() 
                : user?.balances.DB.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Consortium Stablecoin (CS)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.balances.CS.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Daily Deposit Used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${user?.dailyDepositUsed.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground"> / $50,000</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common operations for your account</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/user/deposit">
            <Button disabled={user?.kycStatus !== 'approved'}>
              <DollarSign className="mr-2 h-4 w-4" />
              Deposit USD
            </Button>
          </Link>
          <Link to="/user/convert">
            <Button variant="outline" disabled={user?.kycStatus !== 'approved'}>
              <ArrowLeftRight className="mr-2 h-4 w-4" />
              Convert Tokens
            </Button>
          </Link>
          <Link to="/user/transfer">
            <Button variant="outline" disabled={user?.kycStatus !== 'approved'}>
              <Send className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          </Link>
          <Link to="/user/kyc">
            <Button variant="ghost">
              <User className="mr-2 h-4 w-4" />
              View KYC Profile
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About Tokenized Deposits</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>DA (Deposit Token A)</strong> - Represents deposits held at Bank A
            </p>
            <p>
              <strong>DB (Deposit Token B)</strong> - Represents deposits held at Bank B
            </p>
            <p>
              <strong>CS (Consortium Stablecoin)</strong> - Used for inter-bank settlements
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Limits</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Daily Deposit Limit:</strong> $50,000 per day
            </p>
            <p>
              <strong>Conversion Cap:</strong> $10,000 per transaction
            </p>
            <p>
              <strong>Inter-Bank Transfers:</strong> Must use CS as settlement token
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
