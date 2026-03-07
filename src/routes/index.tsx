import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authClient, useSession } from '@/lib/client/auth-client';
import { Cloud, TrendingDown, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/')({ component: LandingPage });

function LandingPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      navigate({ to: '/dashboard' });
    }
  }, [session, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === 'signup') {
        const result = await authClient.signUp.email({
          name: name || 'User',
          email,
          password,
          callbackURL: '/dashboard',
        });
        if (result.error) {
          setError(result.error.message ?? 'Sign up failed');
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
          callbackURL: '/dashboard',
        });
        if (result.error) {
          setError(result.error.message ?? 'Sign in failed');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    });
  };

  const hasGoogle =
    import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans text-foreground">
      <Card className="w-full max-w-4xl border-0 shadow-xl rounded-3xl overflow-hidden bg-card p-0 gap-0">
        {/* Hero Section */}
        <div className="p-10 sm:p-14 md:p-16 text-center flex flex-col items-center space-y-10">
          <div className="w-full max-w-lg space-y-10">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-500/20 transform rotate-3 transition-transform hover:rotate-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-8 h-8"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-5">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-foreground">
                Crush your debt.
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-normal">
                The simple, powerful calculator to help you plan your payoff
                strategy and save thousands in interest.
              </p>
            </div>

            {/* Auth Form */}
            <div className="space-y-4 pt-2">
              <form
                onSubmit={handleEmailAuth}
                className="flex flex-col gap-4 text-left"
              >
                {mode === 'signup' && (
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                )}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                    required
                    minLength={mode === 'signup' ? 8 : undefined}
                    className="w-full h-11 px-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                  className="w-full h-12 text-lg font-semibold rounded-xl"
                >
                  {isLoading
                    ? 'Please wait...'
                    : mode === 'signin'
                      ? 'Sign in'
                      : 'Create account'}
                </Button>
              </form>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {mode === 'signin'
                    ? "Don't have an account?"
                    : 'Already have an account?'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </div>
              {hasGoogle && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        or
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={handleGoogleSignIn}
                    className="w-full h-12 text-base font-semibold rounded-xl"
                  >
                    <svg
                      className="mr-3 h-5 w-5"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 488 512"
                    >
                      <path
                        fill="currentColor"
                        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                      />
                    </svg>
                    Sign in with Google
                  </Button>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                No credit card required.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="bg-muted/30 border-t border-border/40 p-10 sm:p-14 md:p-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center shadow-sm text-green-600 ring-1 ring-black/5">
                <TrendingDown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Smart Strategies
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Compare Avalanche vs. Snowball to find your fastest debt-free
                  path.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center shadow-sm text-green-600 ring-1 ring-black/5">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Clear Timeline
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Visualize your progress with a clear payoff date and monthly
                  schedule.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-background rounded-xl flex items-center justify-center shadow-sm text-green-600 ring-1 ring-black/5">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Access Anywhere
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Securely save your plan to track your journey from any device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
