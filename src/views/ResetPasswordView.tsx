import { useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@tanstack/react-router';

export function ResetPasswordView() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSuccess(true);
      toast({
        title: '发送成功',
        description: '密码重置邮件已发送至你的邮箱',
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: '错误',
        description: '重置邮件发送失败，请稍后重试',
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
            <span className="text-2xl font-semibold tracking-tight text-adam-text-primary">
              智造3D
            </span>
            <h1 className="text-2xl font-semibold text-adam-text-primary">
              重置密码
            </h1>
          </div>
          {!isSuccess ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-adam-text-primary">
                  邮箱
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="border-gray-300 bg-adam-bg-dark text-adam-text-primary placeholder:text-gray-500"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    发送中…
                  </>
                ) : (
                  '发送重置邮件'
                )}
              </Button>

              <Link
                to="/signin"
                className="flex w-full items-center justify-center text-adam-blue hover:text-adam-blue/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                <p className="text-sm">返回登录</p>
              </Link>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-green-400">
                请查收邮件，并按邮件中的说明重置密码。
              </p>
              <Link
                to="/signin"
                className="flex w-full items-center justify-center text-adam-blue hover:text-adam-blue/80"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                <p className="text-sm">返回登录</p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
