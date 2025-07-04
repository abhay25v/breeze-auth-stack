import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Star, Heart, Filter, ChevronDown } from 'lucide-react';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { RiskScoreDisplay } from '@/components/analytics/RiskScoreDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Mock product data
const products = [
  {
    id: 1,
    name: "Samsung 65\" 4K Smart TV",
    price: 599.99,
    originalPrice: 799.99,
    rating: 4.5,
    reviews: 1234,
    image: "/placeholder.svg",
    category: "Electronics",
    savings: 200,
    inStock: true
  },
  {
    id: 2,
    name: "Apple iPhone 15 Pro",
    price: 999.99,
    originalPrice: 1099.99,
    rating: 4.8,
    reviews: 2567,
    image: "/placeholder.svg",
    category: "Electronics",
    savings: 100,
    inStock: true
  },
  {
    id: 3,
    name: "Nike Air Max 270",
    price: 129.99,
    originalPrice: 149.99,
    rating: 4.3,
    reviews: 892,
    image: "/placeholder.svg",
    category: "Shoes",
    savings: 20,
    inStock: true
  },
  {
    id: 4,
    name: "Instant Pot Duo 7-in-1",
    price: 79.99,
    originalPrice: 119.99,
    rating: 4.7,
    reviews: 3456,
    image: "/placeholder.svg",
    category: "Kitchen",
    savings: 40,
    inStock: false
  },
  {
    id: 5,
    name: "LEGO Creator Expert Taj Mahal",
    price: 369.99,
    originalPrice: 399.99,
    rating: 4.9,
    reviews: 445,
    image: "/placeholder.svg",
    category: "Toys",
    savings: 30,
    inStock: true
  },
  {
    id: 6,
    name: "Dyson V15 Detect Vacuum",
    price: 649.99,
    originalPrice: 749.99,
    rating: 4.6,
    reviews: 1678,
    image: "/placeholder.svg",
    category: "Home",
    savings: 100,
    inStock: true
  }
];

const categories = ["All", "Electronics", "Shoes", "Kitchen", "Toys", "Home"];

const ShopPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<number[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const { toast } = useToast();

  // Initialize analytics tracking with automatic data sending
  const { analytics, sendAnalytics, sessionId } = useUserAnalytics({
    trackTyping: true,
    trackScroll: true,
    trackMouse: true,
    trackFocus: true,
    sendInterval: 30000, // Send every 30 seconds
    onDataReady: async (data) => {
      // Automatically calculate risk score and log to database
      try {
        const { data: riskData, error } = await supabase.functions.invoke('risk-score', {
          body: {
            ...data,
            pageUrl: window.location.href,
            userAgent: navigator.userAgent
          }
        });

        if (riskData?.success && riskData.riskScore > 0) {
          // Log the risk assessment to database
          const { error: logError } = await supabase
            .from('otp_attempts')
            .insert({
              session_id: data.sessionId,
              risk_score: riskData.riskScore,
              otp_code: 'AUTO_RISK_' + Date.now(), // Automated risk check
              is_valid: true,
              ip_address: null,
              user_agent: data.userAgent
            });

          if (logError) {
            console.error('Failed to log risk assessment:', logError);
          }
        }
      } catch (error) {
        console.error('Risk assessment failed:', error);
      }
    }
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (productId: number) => {
    setCart(prev => [...prev, productId]);
    const product = products.find(p => p.id === productId);
    toast({
      title: "Added to Cart",
      description: `${product?.name} has been added to your cart.`,
    });
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero Banner */}
        <div className="bg-primary text-primary-foreground py-12 mb-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Save big on everything you need</h1>
            <p className="text-lg mb-6">Shop millions of items with free shipping on orders $35+</p>
            <div className="max-w-2xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search everything at MyShop"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 bg-background text-foreground"
                />
              </div>
              <Button size="lg" variant="secondary">
                Search
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">
          {/* Navigation & Filters */}
          <div className="flex flex-wrap gap-4 mb-8 items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                <Badge variant="secondary">{cart.length}</Badge>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredProducts.map(product => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 ${wishlist.includes(product.id) ? 'fill-destructive text-destructive' : ''}`} />
                    </Button>
                    {product.savings > 0 && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground">
                        Save ${product.savings}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(product.rating) 
                              ? 'fill-yellow-400 text-yellow-400' 
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviews})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg font-bold text-foreground">
                      ${product.price}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>

                  <Button 
                    onClick={() => addToCart(product.id)}
                    disabled={!product.inStock}
                    className="w-full"
                    variant={product.inStock ? "default" : "outline"}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Analytics Display - Hidden but tracking in background */}
          <div className="hidden">
            <RiskScoreDisplay 
              behaviorData={analytics} 
              sessionId={sessionId}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShopPage;