import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  FileText, 
  Settings, 
  CreditCard,
  User,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const adminNavItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/students', icon: Users, label: 'Students' },
    { to: '/admin/fee-structure', icon: DollarSign, label: 'Fee Structure' },
    { to: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { to: '/admin/reports', icon: FileText, label: 'Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' }
  ];

  const studentNavItems = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/fees', icon: DollarSign, label: 'Fee Payment' },
    { to: '/student/profile', icon: User, label: 'Profile' }
  ];

  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <aside className="w-64 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-sidebar-foreground" />
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">Edu-Pay</h1>
            <p className="text-xs text-sidebar-foreground/70">Basaveshwar Engineering College (BEC)</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* User section */}
      <div className="p-4 space-y-2">
        <div className="px-4 py-2 text-sm">
          <p className="text-sidebar-foreground font-medium">{user?.name}</p>
          <p className="text-sidebar-foreground/70 text-xs">{user?.email}</p>
          <p className="text-sidebar-foreground/60 text-xs mt-1 capitalize">{user?.role}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={logout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
};
