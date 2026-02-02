import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminService } from '@/services/AdminService';
import { KycProfile, BankLimits } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Building, 
  DollarSign,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [pendingKyc, setPendingKyc] = useState<KycProfile[]>([]);
  const [limits, setLimits] = useState<BankLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [kycData, limitsData] = await Promise.all([
        AdminService.getPendingKyc(),
        AdminService.getBankLimits(),
      ]);
      setPendingKyc(kycData);
      setLimits(limitsData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of banking operations and pending tasks
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{pendingKyc.length}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Deposit Limits</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="space-y-1">
                <div className="text-sm">
                  Bank A: <span className="font-bold">${limits?.bankA.dailyDepositLimit.toLocaleString()}</span>
                </div>
                <div className="text-sm">
                  Bank B: <span className="font-bold">${limits?.bankB.dailyDepositLimit.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Off-Chain Ledger Limit</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">
                ${limits?.offChainLedgerLimit.toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum allowed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending KYC Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pending KYC Applications</CardTitle>
            <CardDescription>
              Review and approve user identity verification requests
            </CardDescription>
          </div>
          <Link to="/admin/kyc">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : pendingKyc.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No pending KYC applications</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingKyc.slice(0, 5).map((kyc) => (
                  <TableRow key={kyc.id}>
                    <TableCell className="font-medium">{kyc.fullName}</TableCell>
                    <TableCell>{kyc.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(kyc.submittedAt), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link to="/admin/limits">
            <Button variant="outline">
              <Building className="mr-2 h-4 w-4" />
              Manage Limits
            </Button>
          </Link>
          <Link to="/admin/kyc">
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Review KYC
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
