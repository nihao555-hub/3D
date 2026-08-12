import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from '@tanstack/react-router';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useMutation } from '@tanstack/react-query';
import { GoogleIcon } from '@/components/icons/CompanyIcons';
import { validateRedirectUrl } from '@/lib/utils';

function getAppRedirectUrl(path: string) {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

  return `${window.location.origin}${basePath}${path}`;
}

export function SignUpEmailView() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signUp, session, user, isLoading: authLoading } = useAuth();

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: '出错了',
        description: '请输入姓名',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: '出错了',
        description: '两次输入的密码不一致',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await signUp(email, password, name);

      toast({
        title: '请验证邮箱',
        description: '请先前往邮箱完成账号验证，再进行登录。',
      });
      sessionStorage.setItem('pendingSignupEmail', email);
      navigate({
        to: '/confirm-email',
      });
    } catch (error) {
      console.error(error);
      toast({
        title: '出错了',
        description:
          error instanceof Error ? error.message : '发生了一些问题，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-adam-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-adam-bg-secondary-dark p-8 shadow-md">
          <div className="mb-4 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl font-semibold tracking-tight text-white">
              智造3D
            </span>
            <h1 className="text-2xl font-semibold text-white">创建账号</h1>
          </div>
          <div className="w-full py-2">
            <Button
              onClick={() => signInWithGoogle()}
              className="flex w-full items-center gap-2 hover:bg-adam-blue/10"
              disabled={isSigningInWithGoogle}
            >
              <GoogleIcon className="w-4" />
              <span>使用 Google 账号继续</span>
            </Button>
          </div>

          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                姓名
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="请输入姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-gray-700 bg-adam-bg-dark px-4 text-white placeholder:text-gray-400 max-[430px]:text-base"
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                密码
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码（至少 6 位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-gray-700 bg-adam-bg-dark px-4 text-white placeholder:text-gray-400 max-[430px]:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                确认密码
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="border-gray-700 bg-adam-bg-dark px-4 text-white placeholder:text-gray-400 max-[430px]:text-base"
              />
            </div>

            <Button type="submit" className="w-full p-6" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建账号中…
                </>
              ) : (
                '创建账号'
              )}
            </Button>

            <div className="text-center text-sm text-white">
              已有账号？{' '}
              <Link
                to="/signin"
                className="text-adam-blue hover:text-adam-blue/80"
              >
                登录
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
