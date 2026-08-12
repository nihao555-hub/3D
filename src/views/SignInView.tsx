import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from '@tanstack/react-router';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { GoogleIcon } from '@/components/icons/CompanyIcons';
import { validateRedirectUrl } from '@/lib/utils';

function getAppRedirectUrl(path: string) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  return `${window.location.origin}${basePath}${path}`;
}

function getRedirectNavigationOptions(path: string) {
  const url = new URL(path, window.location.origin);
  const search = Object.fromEntries(url.searchParams.entries());

  return {
    to: url.pathname,
    search,
    hash: url.hash ? url.hash.slice(1) : undefined,
  };
}

export function SignInView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'password' | 'magiclink'>('password');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signIn,
    signInWithMagicLink,
    verifyOtp,
    session,
    user,
    isLoading: authLoading,
  } = useAuth();
  const { toast } = useToast();

  // Get and validate redirect parameter from URL
  const searchParams = new URLSearchParams(location.searchStr);
  const rawRedirectPath = searchParams.get('redirect');
  const redirectPath = validateRedirectUrl(rawRedirectPath);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!authLoading && session && user) {
      navigate({ to: '/', replace: true });
    }
  }, [session, user, authLoading, navigate]);

  const { mutate: signInWithGoogle, isPending: isSigningInWithGoogle } =
    useMutation({
      mutationFn: async () => {
        // Use Supabase's built-in redirectTo parameter with validated URL
        const redirectTo =
          redirectPath !== '/'
            ? getAppRedirectUrl(redirectPath)
            : getAppRedirectUrl('/');

        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo,
          },
        });
      },
      onError: (error) => {
        toast({
          title: '出错了',
          description:
            error instanceof Error
              ? error.message
              : '发生了一些问题，请稍后重试',
          variant: 'destructive',
        });
      },
    });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      // Navigate to validated redirect path
      navigate(getRedirectNavigationOptions(redirectPath));
    } catch (err) {
      const error = err as AuthError;
      const message =
        error.message === 'Invalid login credentials'
          ? '邮箱或密码不正确'
          : '登录时发生错误，请稍后重试';
      setError(message);
      toast({
        title: '出错了',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await signInWithMagicLink(email);
      setMagicLinkSent(true);
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      toast({
        title: '出错了',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setIsVerifying(true);
    setError(null);
    try {
      await verifyOtp(email, otp);
      navigate(getRedirectNavigationOptions(redirectPath));
    } catch (err) {
      const error = err as AuthError;
      setError(error.message);
      toast({
        title: '出错了',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-adam-bg-dark p-4">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-4 rounded-lg bg-adam-bg-secondary-dark p-8 shadow-md">
            <button
              onClick={() => {
                setMagicLinkSent(false);
                setOtp('');
                setError(null);
                setMode('password');
              }}
              className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </button>

            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-adam-blue/20">
                <Mail className="h-6 w-6 text-adam-blue" />
              </div>
              <h3 className="text-lg font-semibold text-white">请查收邮件</h3>
              <p className="text-center text-sm text-gray-400">
                我们已将登录链接发送至{' '}
                <span className="font-medium text-white">{email}</span>
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="relative flex items-center gap-3 py-2">
              <div className="h-px flex-1 bg-gray-700" />
              <span className="text-xs text-gray-500">或手动输入验证码</span>
              <div className="h-px flex-1 bg-gray-700" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerifyOtp();
              }}
              className="flex flex-col gap-4"
            >
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOtp}
                  className="gap-2"
                >
                  <InputOTPGroup className="text-white">
                    <InputOTPSlot
                      index={0}
                      className="h-11 w-11 border-gray-700 bg-adam-bg-dark"
                    />
                    <InputOTPSlot
                      index={1}
                      className="h-11 w-11 border-gray-700 bg-adam-bg-dark"
                    />
                    <InputOTPSlot
                      index={2}
                      className="h-11 w-11 border-gray-700 bg-adam-bg-dark"
                    />
                  </InputOTPGroup>
                  <InputOTPSeparator className="text-gray-500" />
                  <InputOTPGroup className="text-white">
                    <InputOTPSlot
                      index={3}
                      className="h-11 w-11 border-gray-700 bg-adam-bg-dark"
                    />
                    <InputOTPSlot
                      index={4}
                      className="h-11 w-11 border-gray-700 bg-adam-bg-dark"
                    />
                    <InputOTPSlot
                      index={5}
                      className="h-11 w-11 border-gray-700 bg-adam-bg-dark"
                    />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={otp.length !== 6 || isVerifying}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    验证中…
                  </>
                ) : (
                  '验证'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-adam-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-4 rounded-lg bg-adam-bg-secondary-dark p-8 shadow-md">
          <div className="mb-4 flex flex-col items-center justify-center">
            <div>
              <span className="text-2xl font-semibold tracking-tight text-white">
                智造3D
              </span>
            </div>
          </div>
          <div className="w-full">
            <Button
              onClick={() => signInWithGoogle()}
              className="flex w-full items-center gap-2 hover:bg-adam-blue/10"
              disabled={isSigningInWithGoogle}
            >
              <GoogleIcon className="w-4" />
              <span>使用 Google 账号继续</span>
            </Button>
          </div>

          <form
            onSubmit={mode === 'password' ? handleSignIn : handleMagicLink}
            className="space-y-6"
          >
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                邮箱
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-700 bg-adam-bg-dark px-4 text-white placeholder:text-gray-400 max-[430px]:text-base"
              />
            </div>

            {mode === 'password' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">
                    密码
                  </Label>
                  <Link
                    to="/reset-password"
                    className="text-sm text-adam-blue hover:text-adam-blue/80"
                  >
                    忘记密码？
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-gray-700 bg-adam-bg-dark px-4 text-white placeholder:text-gray-400 max-[430px]:text-base"
                />
              </div>
            )}

            <div className="text-center">
              <button
                type="button"
                className="text-sm text-adam-blue hover:text-adam-blue/80"
                onClick={() => {
                  setMode(mode === 'password' ? 'magiclink' : 'password');
                  setError(null);
                }}
              >
                {mode === 'password' ? '改用邮箱链接免密登录' : '改用密码登录'}
              </button>
            </div>

            <Button type="submit" className="w-full p-6" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'password' ? '登录中…' : '发送中…'}
                </>
              ) : mode === 'password' ? (
                '登录'
              ) : (
                '发送登录链接'
              )}
            </Button>

            <div className="text-center text-sm text-white">
              还没有账号？{' '}
              <Link
                to="/signup"
                className="text-adam-blue hover:text-adam-blue/80"
              >
                注册
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
