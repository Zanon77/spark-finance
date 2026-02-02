import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBlockchainEvents } from '@/hooks/useBlockchainEvents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  DollarSign,
  ArrowLeftRight,
  Send,
  History,
  LogOut,
  Building2,
} from 'lucide-react';

const navItems = [
  { path: '/user', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/user/kyc', label: 'KYC Profile', icon: User },
  { path: '/user/deposit', label: 'Deposit', icon: DollarSign },
  { path: '/user/convert', label: 'Convert', icon: ArrowLeftRight },
  { path: '/user/transfer', label: 'Transfer', icon: Send },
  { path: '/user/history', label: 'History', icon: History },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Listen to blockchain events for global notifications
  useBlockchainEvents();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getKycBadge = () => {
    switch (user?.kycStatus) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-600 hover:bg-green-500/20">KYC Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">KYC Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">KYC Rejected</Badge>;
      default:
        return <Badge variant="outline">KYC Required</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">User Portal</span>
            <Badge variant="outline">Bank {user?.bank}</Badge>
          </div>
          
          <div className="flex items-center gap-4">
            {getKycBadge()}
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path) && location.pathname !== '/user';
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Balances */}
          <div className="p-4 border-t mt-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Balances
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">USD</span>
                <span className="font-medium">${user?.balances.USD.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DA</span>
                <span className="font-medium">{user?.balances.DA.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DB</span>
                <span className="font-medium">{user?.balances.DB.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CS</span>
                <span className="font-medium">{user?.balances.CS.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
