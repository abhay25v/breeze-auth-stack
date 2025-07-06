import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingCart, Star, Heart, Filter, ChevronDown, User, Menu } from 'lucide-react';
import { useUserAnalytics } from '@/hooks/useUserAnalytics';
import { RiskScoreDisplay } from '@/components/analytics/RiskScoreDisplay';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Mock product data
const products = [
  {
    id: 1,
    name: "Samsung 65\" 4K Smart TV",
    price: 599.99,
    originalPrice: 799.99,
    rating: 4.5,
    reviews: 1234,
    image: "/images/samsung-tv.avif",
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
    image: "/images/iphone-15-pro.webp",
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
    image: "/images/nike-air-max.webp",
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
    image: "/images/instant-pot.jpg",
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
    image: "/images/lego-creator-expert.jpg",
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
    image: "/images/dyson.webp",
    category: "Home",
    savings: 100,
    inStock: true
  },
  {
    id: 7,
    name: "HP Pavilion 15.6\" Laptop",
    price: 449.99,
    originalPrice: 499.99,
    rating: 4.2,
    reviews: 978,
    image: "/images/hp-pavalion.webp",
    category: "Electronics",
    savings: 50,
    inStock: true
  },
  {
    id: 8,
    name: "Xbox Series X",
    price: 499.99,
    originalPrice: 549.99,
    rating: 4.8,
    reviews: 3120,
    image: "/images/xbox.webp",
    category: "Electronics",
    savings: 50,
    inStock: true
  },
  {
    id: 9,
    name: "Sunbeam Microwave Oven",
    price: 59.99,
    originalPrice: 79.99,
    rating: 4.0,
    reviews: 542,
    image: "/images/sunbeam.webp",
    category: "Kitchen",
    savings: 20,
    inStock: true
  },
  {
    id: 10,
    name: "Great Value White Bread, 20 oz",
    price: 1.48,
    originalPrice: 1.48,
    rating: 4.5,
    reviews: 1832,
    image: "/images/bread.avif",
    category: "Groceries",
    savings: 0,
    inStock: true
  },
  {
    id: 11,
    name: "Equate Acetaminophen 500mg, 100ct",
    price: 4.98,
    originalPrice: 6.47,
    rating: 4.7,
    reviews: 942,
    image: "/images/medicine.webp",
    category: "Health",
    savings: 1.49,
    inStock: true
  },
  {
    id: 12,
    name: "Mainstays Basic Bath Towel",
    price: 3.93,
    originalPrice: 4.96,
    rating: 4.2,
    reviews: 2756,
    image: "/images/towel.webp",
    category: "Home",
    savings: 1.03,
    inStock: true
  },
  {
    id: 13,
    name: "Ozark Trail 20oz Tumbler",
    price: 9.88,
    originalPrice: 12.97,
    rating: 4.8,
    reviews: 5462,
    image: "/images/tumbler.webp",
    category: "Kitchen",
    savings: 3.09,
    inStock: true
  },
  {
    id: 14,
    name: "Summer's Eve Cleansing Wash",
    price: 3.97,
    originalPrice: 3.97,
    rating: 4.6,
    reviews: 1243,
    image: "/images/sunscreen.webp",
    category: "Health",
    savings: 0,
    inStock: true
  }
];

const categories = ["All", "Electronics", "Groceries", "Health", "Kitchen", "Toys", "Home"];

const deals = [
  {
    title: "Flash Deals",
    description: "Up to 45% off",
    image: "/images/flash-1.jpg",
    linkText: "Shop now"
  },
  {
    title: "Summer home trends",
    description: "Refresh your space",
    image: "/images/flash-2.jpg",
    linkText: "Shop home"
  },
  {
    title: "Save on home appliances",
    description: "Up to 40% off",
    image: "/images/flash-3.webp",
    linkText: "Shop now"
  }
];

const ShopPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<number[]>([]);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const { toast } = useToast();

  // Initialize analytics tracking with more aggressive data sending
  const { analytics, sendAnalytics, sessionId } = useUserAnalytics({
    trackTyping: true,
    trackScroll: true,
    trackMouse: true,
    trackFocus: true,
    sendInterval: 5000, // Send every 5 seconds for more immediate updates
    onDataReady: async (data) => {
      // Store detailed analytics data in user_analytics table
      try {
        console.log('📊 Analytics data received:', data);
        console.log('📊 Sending detailed user analytics data to user_analytics table...', data);
        
         const analyticsPayload = {
           session_id: data.sessionId,
           user_id: null, // Since we don't have user auth on shop page
           page_url: window.location.href,
           user_agent: navigator.userAgent,
           typing_wpm: data.typing?.wpm || 0,
           typing_keystrokes: data.typing?.keystrokes || 0,
           typing_corrections: data.typing?.backspaces || 0,
           mouse_clicks: data.mouse?.clicks || 0,
           mouse_movements: Math.round(data.mouse?.totalDistance || 0),
           mouse_velocity: data.mouse?.averageSpeed || 0,
           mouse_idle_time: data.mouse?.idleTime || 0,
           scroll_depth: data.scroll?.maxDepth || 0,
           scroll_speed: data.scroll?.scrollSpeed || 0,
           scroll_events: Math.round(data.scroll?.totalScrollDistance / 100) || 0,
           focus_changes: data.focus?.focusEvents || 0,
           focus_time: data.focus?.totalFocusTime || 0,
           tab_switches: data.focus?.tabSwitches || 0,
           session_duration: data.sessionDuration || 0,
           page_views: 1,
           interactions_count: (data.mouse?.clicks || 0) + (data.typing?.keystrokes || 0) + Math.round((data.scroll?.totalScrollDistance || 0) / 100),
           metadata: {
             page_type: 'shop',
             real_data: true, // Mark as real data, not test data
             shop_metrics: {
               product_views: Array.from(viewedProducts.current),
               cart_actions: cart.length,
               wishlist_actions: wishlist.length,
               category_changes: activityMetrics.current.categoryChanges,
               searches: activityMetrics.current.searches,
               current_category: selectedCategory,
               search_term: searchTerm,
               timestamp: new Date().toISOString()
             }
           }
         };

         const { error: analyticsError } = await supabase
           .from('user_analytics')
           .insert(analyticsPayload); // Use insert instead of upsert to create new records

        if (analyticsError) {
          console.error('❌ Failed to store user_analytics:', analyticsError);
        } else {
          console.log('✅ Successfully stored detailed analytics to user_analytics table');
        }
      } catch (error) {
        console.error('❌ User analytics storage failed:', error);
      }
    }
  });

  // Filter products based on search term and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Track product views with a ref to avoid duplicate tracking
  const viewedProducts = React.useRef<Set<number>>(new Set());
  
  // Store activity metrics locally between intervals
  const activityMetrics = React.useRef({
    productViews: new Set<number>(),
    cartActions: 0,
    wishlistActions: 0,
    categoryChanges: 0,
    searches: 0,
    lastProcessedTime: Date.now()
  });
  
  // Process and send activity data with better handling of metadata
  useEffect(() => {
    const processActivityData = async () => {
      const now = Date.now();
      // Only proceed if we have activity to report
      const hasActivity = 
        activityMetrics.current.productViews.size > 0 || 
        activityMetrics.current.cartActions > 0 || 
        activityMetrics.current.wishlistActions > 0 ||
        activityMetrics.current.categoryChanges > 0 ||
        activityMetrics.current.searches > 0;
      
      if (!hasActivity) return;
      
      console.log('Processing shop activity metrics...');
      
      try {
        // Create a plain object for the metadata (not using complex structures)
        const metadataObj = {
          product_views: Array.from(activityMetrics.current.productViews),
          cart_actions: activityMetrics.current.cartActions,
          wishlist_actions: activityMetrics.current.wishlistActions,
          category_changes: activityMetrics.current.categoryChanges, 
          searches: activityMetrics.current.searches,
          timestamp: new Date().toISOString()
        };
        
        console.log('Sending shop activity data:', JSON.stringify(metadataObj));

        // Send as plain object - works for JSONB columns
        const { error } = await supabase.from('otp_attempts').insert({
          session_id: sessionId,
          risk_score: 10,
          otp_code: `SHOP_ACTIVITY_${now}`,
          is_valid: true,
          user_agent: navigator.userAgent,
          metadata: metadataObj  // Plain object for JSONB columns
        });
        
        if (error) {
          console.error('Failed to store shop activity:', error);
        } else {
          console.log('Successfully stored shop activity');
        }

        // Update analytics data too - analytics should have shop metrics in metadata
        const { error: analyticsError } = await supabase
          .from('user_analytics')
          .upsert({
            session_id: sessionId,
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            typing_wpm: 0,
            typing_keystrokes: 0,
            typing_corrections: 0,
            mouse_clicks: 0,
            mouse_movements: 0,
            mouse_velocity: 0,
            mouse_idle_time: 0,
            scroll_depth: 0,
            scroll_speed: 0,
            scroll_events: 0,
            focus_changes: 0,
            focus_time: 0,
            tab_switches: 0,
            session_duration: 0,
            page_views: 1,
            interactions_count: 0,
            metadata: { shop_metrics: metadataObj }  // Put shop metrics inside metadata object
          }, {
            onConflict: 'session_id'
          });
        
        if (analyticsError) {
          console.error('Failed to update analytics with shop data:', analyticsError);
        }

        // Reset the metrics after sending
        activityMetrics.current = {
          productViews: new Set<number>(),
          cartActions: 0,
          wishlistActions: 0, 
          categoryChanges: 0,
          searches: 0,
          lastProcessedTime: now
        };
      } catch (error) {
        console.error('Failed to process activity metrics:', error);
      }
    };
    
    // Process metrics frequently to see results quickly during testing
    const intervalId = setInterval(processActivityData, 3000);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      processActivityData(); // Final processing before unmount
    };
  }, [sessionId]);
  
  // Simplified tracking function that just updates local metrics instead of sending immediately
  const trackUserAction = React.useCallback((actionType: string, details: any) => {
    switch (actionType) {
      case 'product_view':
        if (details.productId) {
          activityMetrics.current.productViews.add(details.productId);
        }
        break;
      case 'add_to_cart':
        activityMetrics.current.cartActions++;
        break;
      case 'add_to_wishlist':
      case 'remove_from_wishlist':
        activityMetrics.current.wishlistActions++;
        break;
      case 'category_select':
        activityMetrics.current.categoryChanges++;
        break;
      case 'search':
        activityMetrics.current.searches++;
        break;
    }
    
    // Just log to console - no immediate database update
    console.log(`Local action tracked: ${actionType}`, details);
  }, []);
  
  // Enhance existing functions with tracking
  const addToCart = (productId: number) => {
    const product = products.find(p => p.id === productId);
    setCart(prev => [...prev, productId]);
    toast({
      title: "Added to Cart",
      description: `${product?.name} has been added to your cart.`,
    });
    
    // Track this action
    if (product) {
      trackUserAction('add_to_cart', {
        productId: product.id,
        productName: product.name,
        category: product.category,
        price: product.price
      });
    }
  };

  const toggleWishlist = (productId: number) => {
    const product = products.find(p => p.id === productId);
    const isAdding = !wishlist.includes(productId);
    
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    
    // Track this action
    if (product) {
      trackUserAction(isAdding ? 'add_to_wishlist' : 'remove_from_wishlist', {
        productId: product.id,
        productName: product.name,
        category: product.category,
        price: product.price
      });
    }
  };

  // Track category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    trackUserAction('category_select', {
      category,
      productCount: products.filter(p => 
        category === 'All' || p.category === category
      ).length
    });
  };
  
  // Track search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim().length > 2) {  // Only track meaningful searches
      trackUserAction('search', {
        searchTerm: term,
        resultCount: products.filter(p => 
          p.name.toLowerCase().includes(term.toLowerCase())
        ).length
      });
    }
  };

  // Track product views using Intersection Observer with duplicate prevention
  useEffect(() => {
    // Keep a local copy of viewed products to prevent re-observing
    const localViewedProducts = new Set(viewedProducts.current);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const productId = Number(entry.target.getAttribute('data-product-id'));
            if (productId && !localViewedProducts.has(productId)) {
              const product = products.find(p => p.id === productId);
              if (product) {
                // Update both local and ref sets
                localViewedProducts.add(productId);
                viewedProducts.current.add(productId);
                
                // Unobserve to prevent future triggers
                observer.unobserve(entry.target);
                
                trackUserAction('product_view', {
                  productId: product.id,
                  productName: product.name,
                  category: product.category,
                  price: product.price
                });
              }
            }
          }
        });
      },
      { threshold: 0.7 }
    );

    // Only observe products that haven't been viewed yet
    document.querySelectorAll('.product-card').forEach(card => {
      const productId = Number(card.getAttribute('data-product-id'));
      if (productId && !localViewedProducts.has(productId)) {
        observer.observe(card);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [filteredProducts, trackUserAction]); // Depend on trackUserAction so it's stable

  // Also add page visibility handling to capture metrics when user leaves
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is navigating away, process metrics one last time
        const processActivityData = async () => {
          if (activityMetrics.current.productViews.size > 0 || 
              activityMetrics.current.cartActions > 0 || 
              activityMetrics.current.wishlistActions > 0 ||
              activityMetrics.current.categoryChanges > 0 ||
              activityMetrics.current.searches > 0) {
            
            console.log('Processing metrics on page leave');
            
            // Use beacon API for more reliable sending during page unload
            const payload = {
              session_id: sessionId,
              risk_score: 10,
              otp_code: `SHOP_ACTIVITY_EXIT_${Date.now()}`,
              is_valid: true,
              user_agent: navigator.userAgent,
              metadata: {
                product_views: Array.from(activityMetrics.current.productViews),
                cart_actions: activityMetrics.current.cartActions,
                wishlist_actions: activityMetrics.current.wishlistActions,
                category_changes: activityMetrics.current.categoryChanges,
                searches: activityMetrics.current.searches,
                timestamp: new Date().toISOString()
              }
            };
            
            if (navigator.sendBeacon) {
              const blob = new Blob([JSON.stringify(payload)], {type: 'application/json'});
              navigator.sendBeacon(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/otp_attempts`, blob);
            }
          }
        };
        
        processActivityData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Walmart-style Header */}
      <header className="bg-[#0071DC] text-white py-3 px-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Menu className="h-6 w-6 mr-3 md:hidden" />
            <span className="font-bold text-2xl mr-4">Walmart</span>
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" className="text-white">Departments</Button>
              <Button variant="ghost" className="text-white">Services</Button>
            </div>
          </div>
          
          <div className="flex-1 mx-4 max-w-4xl">
            <div className="relative">
              <Input
                placeholder="Search everything at Walmart online and in store"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-12 h-12 rounded-full bg-white text-black"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Button size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full bg-[#FFC220] hover:bg-[#FFD45E] text-black">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <User className="h-5 w-5" />
              <span className="text-xs">Account</span>
            </div>
            <div className="flex flex-col items-center relative">
              <ShoppingCart className="h-5 w-5" />
              <Badge className="absolute -top-2 -right-2 bg-[#FFC220] text-black">{cart.length}</Badge>
              <span className="text-xs">${(0).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Navigation Menu */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto py-2 space-x-6 no-scrollbar">
            {["Deals", "Grocery & essentials", "Home", "Tech", "Fashion", "Auto", "Walmart+"].map((item) => (
              <Button key={item} variant="ghost" className="whitespace-nowrap text-sm">
                {item}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Hero Banner */}
        <div className="bg-[#E6F1FC] rounded-lg mb-8 overflow-hidden">
          <div className="grid md:grid-cols-2 items-center">
            <div className="p-8">
              <h1 className="text-3xl font-bold mb-4">July 4th faves from $1.98</h1>
              <p className="text-lg mb-6">Get it in as fast as an hour*</p>
              <Button className="bg-[#0071DC] hover:bg-blue-700 text-white">
                Shop now
              </Button>
            </div>
            <div>
              <img 
                src="images/home-1.jpeg" 
                alt="July 4th deals" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>

        {/* Featured Deals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {deals.map((deal, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="p-6 bg-[#F8F9FA]">
                <h3 className="text-xl font-bold">{deal.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{deal.description}</p>
                <Button variant="link" className="text-[#0071DC] p-0">
                  {deal.linkText}
                </Button>
              </div>
              <div className="h-48 overflow-hidden">
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          ))}
        </div>

        {/* Category Tabs & Products */}
        <Tabs 
          value={selectedCategory} 
          onValueChange={handleCategoryChange}  // Use the tracking function
          className="mb-8"
        >
          <TabsList className="mb-4 bg-transparent border-b w-full overflow-x-auto flex justify-start">
            {categories.map(category => (
              <TabsTrigger 
                key={category} 
                value={category}
                className="data-[state=active]:bg-[#0071DC] data-[state=active]:text-white rounded-t-lg"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredProducts.map(product => (
              <Card 
                key={product.id} 
                className="group border hover:shadow-md transition-all duration-200 product-card"
                data-product-id={product.id} // For intersection observer
              >
                <CardHeader className="p-2">
                  <div className="aspect-square bg-gray-50 rounded-sm mb-2 relative overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                    {product.savings > 0 && (
                      <Badge className="absolute top-2 left-2 bg-[#E50000] text-white font-bold rounded-sm">
                        ${product.savings} off
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product.id);
                      }}
                    >
                      <Heart className={`h-4 w-4 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="flex flex-col h-full">
                    <div className="flex items-baseline mb-1">
                      <span className="text-lg font-bold text-[#E50000]">
                        ${product.price}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs text-gray-500 line-through ml-2">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-sm line-clamp-2 flex-grow mb-2">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center gap-1 mb-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({product.reviews})
                      </span>
                    </div>

                    {product.inStock ? (
                      <div className="mt-1">
                        <Button 
                          onClick={() => addToCart(product.id)}
                          className="w-full bg-[#0071DC] hover:bg-blue-700 text-white text-xs h-8"
                        >
                          Add to cart
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs text-red-500 font-medium mt-1">
                        Out of stock
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Tabs>
      </div>
      
      {/* Silent analytics tracker - no visible UI */}
      <div className="hidden">
        <RiskScoreDisplay 
          behaviorData={{
            ...analytics,
            shopActivities: {
              productViews: viewedProducts.current.size,
              cartActions: cart.length,
              wishlistActions: wishlist.length,
              categoryChanges: selectedCategory !== 'All' ? 1 : 0,
              searchActions: searchTerm.length > 0 ? 1 : 0
            }
          }}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
};

export default ShopPage;