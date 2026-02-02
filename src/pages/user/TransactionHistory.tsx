import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserService } from '@/services/UserService';
import { TransactionRecord } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { History, ExternalLink, ArrowDownRight, ArrowLeftRight, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [user?.id]);

  const loadTransactions = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await UserService.getHistory(user.id);
      setTransactions(data);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: TransactionRecord['type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      case 'convert':
        return <ArrowLeftRight className="h-4 w-4 text-blue-500" />;
      case 'intra_transfer':
      case 'inter_transfer':
        return <ArrowUpRight className="h-4 w-4 text-orange-500" />;
    }
  };

  const getTypeBadge = (type: TransactionRecord['type']) => {
    const labels = {
      deposit: 'Deposit',
      convert: 'Convert',
      intra_transfer: 'Intra-Bank',
      inter_transfer: 'Inter-Bank',
    };

    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      deposit: 'default',
      convert: 'secondary',
      intra_transfer: 'outline',
      inter_transfer: 'outline',
    };

    return <Badge variant={variants[type]}>{labels[type]}</Badge>;
  };

  const getStatusBadge = (status: TransactionRecord['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/20">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground">
          View your recent deposits, conversions, and transfers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 20 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm">Your transaction history will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(tx.date), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        {getTypeBadge(tx.type)}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[250px]">
                      <span className="truncate block" title={tx.details}>
                        {tx.details}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {tx.amount.toLocaleString()}
                      {tx.from && tx.to && (
                        <span className="text-xs text-muted-foreground ml-1">
                          {tx.from}→{tx.to}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                      >
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
