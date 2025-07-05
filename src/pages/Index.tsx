
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Layout>
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Full-Stack React App
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern web application with JWT authentication, built with React, TypeScript, and ready for FastAPI backend integration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg" className="flex items-center space-x-2">
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="flex items-center space-x-2">
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Secure Authentication</CardTitle>
              <CardDescription>
                JWT-based authentication with protected routes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Email/password login</li>
                <li>• Token-based sessions</li>
                <li>• Protected routes</li>
                <li>• Auto token refresh</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Modern Stack</CardTitle>
              <CardDescription>
                Built with the latest technologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• React 18 + TypeScript</li>
                <li>• Tailwind CSS styling</li>
                <li>• Shadcn/ui components</li>
                <li>• React Query integration</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Full-Stack Ready</CardTitle>
              <CardDescription>
                Organized structure for scalable development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• API client utilities</li>
                <li>• Type-safe interfaces</li>
                <li>• Modular components</li>
                <li>• FastAPI integration ready</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Architecture Section */}
        <section className="bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Project Structure</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-3">Frontend Structure</h3>
              <pre className="text-sm bg-background p-4 rounded border overflow-x-auto">
{`src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── ui/             # Base UI components
├── hooks/              # Custom React hooks
├── pages/              # Route components
├── types/              # TypeScript definitions
├── utils/              # Utility functions
└── assets/             # Static assets & docs`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Backend Integration</h3>
              <pre className="text-sm bg-background p-4 rounded border overflow-x-auto">
{`backend/                # FastAPI backend
├── api/                # API route handlers
├── models/             # Database models
├── utils/              # Backend utilities
└── main.py             # FastAPI app

Features:
• JWT authentication
• Type-safe API client
• Error handling
• Token management`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
