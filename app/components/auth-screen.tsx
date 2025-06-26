"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface AuthScreenProps {
  onBack?: () => void;
  onAuthStart?: () => void;
}

export default function AuthScreen({ onBack, onAuthStart }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    if (onAuthStart) onAuthStart();
    setLoading(true);
    setError(null);
    try {
      if (action === 'signUp') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // On success, the main page will automatically rerender.
    } catch (error: any) {
      setError(error.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 animate-pulse">
          <div className="h-6 w-6 text-amber-300 opacity-70" />
        </div>
        <div className="absolute top-40 right-20 animate-bounce">
          <div className="h-8 w-8 text-blue-300 opacity-60" />
        </div>
        <div className="absolute bottom-32 left-1/4 animate-pulse">
          <div className="h-5 w-5 text-orange-300 opacity-50" />
        </div>
        <div className="absolute top-1/3 right-1/3 animate-ping">
          <div className="h-2 w-2 bg-pink-400 rounded-full opacity-40"></div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="absolute top-8 left-8 text-purple-300 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        
        <Card className="w-[400px] border border-white/10 shadow-2xl bg-white/5 backdrop-blur-xl">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 bg-transparent">
              <TabsTrigger value="signin" className="text-purple-300 data-[state=active]:bg-white/10 data-[state=active]:text-white">Sign In</TabsTrigger>
              <TabsTrigger value="signup" className="text-purple-300 data-[state=active]:bg-white/10 data-[state=active]:text-white">Sign Up</TabsTrigger>
            </TabsList>
            
            <div className="p-6">
              <TabsContent value="signin">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-white text-2xl">Welcome Back</CardTitle>
                  <CardDescription className="text-purple-300">Access your saved journeys.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="space-y-2">
                    <Label htmlFor="email-in" className="text-purple-200">Email</Label>
                    <Input id="email-in" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-in" className="text-purple-200">Password</Label>
                    <Input id="password-in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/20 text-white focus:ring-purple-400" />
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch p-0 mt-6">
                  {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                  <Button onClick={() => handleAuthAction('signIn')} disabled={loading} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold">
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </CardFooter>
              </TabsContent>
              <TabsContent value="signup">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-white text-2xl">Join the Cosmos</CardTitle>
                  <CardDescription className="text-purple-300">Create an account to save your journeys.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 p-0">
                  <div className="space-y-2">
                    <Label htmlFor="email-up" className="text-purple-200">Email</Label>
                    <Input id="email-up" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 focus:ring-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password-up" className="text-purple-200">Password</Label>
                    <Input id="password-up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/5 border-white/20 text-white focus:ring-purple-400" />
                  </div>
                </CardContent>
                <CardFooter className="flex-col items-stretch p-0 mt-6">
                  {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}
                  <Button onClick={() => handleAuthAction('signUp')} disabled={loading} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </CardFooter>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
} 