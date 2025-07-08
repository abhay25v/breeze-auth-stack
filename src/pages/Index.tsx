import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  Eye, 
  Brain, 
  Lock, 
  Zap, 
  Users, 
  TrendingUp, 
  Award,
  ShoppingCart,
  Monitor,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const Index = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Layout>
      <div className="space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-8 py-12">
          <div className="space-y-4">
            <Badge variant="outline" className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <Award className="h-4 w-4 mr-2" />
              Walmart Sparkathon 2025 - Cybersecurity Challenge
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Breeze Auth Stack
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Advanced behavioral analytics and risk assessment platform that revolutionizes e-commerce security through real-time user behavior monitoring.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/shop">
                  <Button size="lg" className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Experience Demo Shop</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="outline" size="lg" className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <span>View Analytics Dashboard</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <span>Start Demo</span>
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

        {/* Problem Statement & Solution */}
        <section className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-8 border border-red-100">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-red-800">Cybersecurity Challenge</h2>
              <p className="text-lg text-red-700">
                E-commerce platforms face increasing threats from sophisticated attacks that traditional security measures cannot detect.
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-red-200 bg-white/70">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-red-600 mb-2" />
                  <CardTitle className="text-red-800">The Problem</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-red-700">Account takeovers through credential stuffing</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-red-700">Bot attacks on e-commerce platforms</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-red-700">Fraudulent transactions and fake accounts</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-red-700">Traditional security measures are reactive, not predictive</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-white/70">
                <CardHeader>
                  <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                  <CardTitle className="text-green-800">Our Solution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-green-700">Real-time behavioral biometrics analysis</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-green-700">AI-powered risk scoring system</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-green-700">Proactive threat detection and prevention</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-green-700">Seamless user experience with enhanced security</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Advanced Security Features</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our platform combines cutting-edge behavioral analytics with machine learning to create an impenetrable defense system.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-blue-200 hover:border-blue-300 transition-colors">
              <CardHeader>
                <Brain className="h-12 w-12 text-blue-600 mb-4" />
                <CardTitle className="text-blue-800">Behavioral Biometrics</CardTitle>
                <CardDescription>
                  Advanced analysis of user interaction patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>Mouse movement tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>Typing pattern analysis</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>Scroll behavior monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Eye className="h-4 w-4 text-blue-500" />
                    <span>Focus and attention tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 hover:border-purple-300 transition-colors">
              <CardHeader>
                <Shield className="h-12 w-12 text-purple-600 mb-4" />
                <CardTitle className="text-purple-800">Risk Assessment Engine</CardTitle>
                <CardDescription>
                  Real-time threat detection and scoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>Dynamic risk scoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>Anomaly detection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>Fraud prevention</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>Adaptive authentication</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-cyan-200 hover:border-cyan-300 transition-colors">
              <CardHeader>
                <Zap className="h-12 w-12 text-cyan-600 mb-4" />
                <CardTitle className="text-cyan-800">Real-time Analytics</CardTitle>
                <CardDescription>
                  Live monitoring and instant response
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4 text-cyan-500" />
                    <span>Live dashboard monitoring</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4 text-cyan-500" />
                    <span>Instant threat alerts</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4 text-cyan-500" />
                    <span>Session activity tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4 text-cyan-500" />
                    <span>Automated responses</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-8 border border-slate-200">
          <h2 className="text-3xl font-bold mb-8 text-center text-slate-800">Technical Architecture</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center">
                  <Lock className="h-5 w-5 mr-2 text-blue-600" />
                  Security Layer
                </h3>
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">JWT Authentication</span>
                      <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Behavioral Biometrics</span>
                      <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Risk Assessment</span>
                      <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Real-time Monitoring</span>
                      <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-lg mb-4 text-slate-700 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  User Experience
                </h3>
                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Seamless Shopping</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">Enhanced</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Invisible Security</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">Transparent</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Adaptive Interface</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">Smart</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Zero Friction Auth</span>
                      <Badge variant="outline" className="text-blue-600 border-blue-200">Optimized</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4 text-slate-700">System Flow</h3>
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <div className="font-medium text-slate-800">User Interaction</div>
                      <div className="text-sm text-slate-600">Capture behavioral patterns</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <div className="font-medium text-slate-800">Analysis Engine</div>
                      <div className="text-sm text-slate-600">Process and analyze data</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-cyan-50 rounded-lg">
                    <div className="w-8 h-8 bg-cyan-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <div className="font-medium text-slate-800">Risk Scoring</div>
                      <div className="text-sm text-slate-600">Generate threat assessment</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <div className="font-medium text-slate-800">Security Action</div>
                      <div className="text-sm text-slate-600">Adaptive response & protection</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="text-center space-y-8 py-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Experience the Future of E-commerce Security</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              See how our behavioral analytics platform detects threats in real-time while maintaining a seamless shopping experience.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <ShoppingCart className="h-8 w-8 mx-auto mb-4 text-blue-200" />
              <h3 className="font-semibold mb-2">Shop Demo</h3>
              <p className="text-sm text-blue-100">
                Browse products while our system analyzes your behavior patterns in real-time.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Monitor className="h-8 w-8 mx-auto mb-4 text-purple-200" />
              <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-sm text-purple-100">
                View comprehensive behavioral analytics and security insights from the admin panel.
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <Shield className="h-8 w-8 mx-auto mb-4 text-cyan-200" />
              <h3 className="font-semibold mb-2">Security Features</h3>
              <p className="text-sm text-cyan-100">
                Experience advanced threat detection with zero impact on user experience.
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/shop">
                  <Button size="lg" variant="secondary" className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4" />
                    <span>Try Demo Shop</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button size="lg" variant="outline" className="flex items-center space-x-2 border-white text-blue-600 hover:bg-white">
                    <Monitor className="h-4 w-4" />
                    <span>View Analytics</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <Link to="/register">
                <Button size="lg" variant="secondary" className="flex items-center space-x-2">
                  <span>Start Free Demo</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <p className="text-sm text-blue-200">
              No setup required • Instant access • Full featured demo
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
