
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary">
          MyApp
        </Link>
        
        <nav className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Link to="/shop">
                <Button variant="ghost" size="sm">
                  Shop
                </Button>
              </Link>
              <Link to="/analytics">
                <Button variant="ghost" size="sm">
                  Analytics
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span className="text-sm font-medium">{user?.name || user?.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
