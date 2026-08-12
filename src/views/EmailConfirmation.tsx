import React, { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

function EmailConfirmation() {
  const [email, setEmail] = useState('');
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('pendingSignupEmail');

    if (storedEmail) {
      setEmail(storedEmail);
      sessionStorage.removeItem('pendingSignupEmail');
    } else {
      setShowEmailInput(true);
    }
  }, []);

  const handleResend = async () => {
    const emailToResend = email.trim();

    if (!emailToResend) {
      toast({
        title: '出错了',
        description: '请先输入邮箱地址，再重新发送验证邮件。',
        variant: 'destructive',
      });
      return;
    }

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend,
      });

      if (error) throw error;

      toast({
        title: '邮件已发送',
        description: '我们已重新发送一封验证邮件，请查收。',
      });
    } catch (error) {
      console.error('Error resending verification email:', error);
      toast({
        title: '出错了',
        description:
          error instanceof Error ? error.message : '验证邮件发送失败',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-adam-bg-dark p-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg bg-adam-bg-secondary-dark p-8 shadow-md">
          {/* Icon and Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-adam-neutral-800">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <h1 className="mb-4 text-2xl font-semibold text-white">
              请查收邮件
            </h1>
            <p className="text-gray-400">
              我们已将验证链接发送至{' '}
              <span className="text-white">{email || '你的邮箱'}</span>
              ，点击链接即可完成账号验证。
            </p>
            <p className="mt-2 text-center text-gray-400">
              （如未收到，请检查垃圾邮件文件夹）
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            {showEmailInput && (
              <div className="space-y-2">
                <Label htmlFor="resend-email" className="text-white">
                  邮箱
                </Label>
                <Input
                  id="resend-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="请输入邮箱"
                  className="border-gray-700 bg-adam-bg-dark px-4 text-white placeholder:text-gray-400 max-[430px]:text-base"
                />
              </div>
            )}

            {/* Alert for spam warning and sign in link */}
            <Alert className="border-adam-neutral-700 bg-adam-neutral-800">
              <AlertDescription className="text-center text-gray-400">
                已完成邮箱验证？{' '}
                <Link
                  to="/signin"
                  className="font-medium text-adam-text-primary transition-colors duration-200 hover:text-adam-text-primary/80"
                >
                  点此登录
                </Link>
              </AlertDescription>
            </Alert>

            {/* Resend Email button */}
            <Button
              type="button"
              className="w-full p-6 text-adam-blue transition-colors duration-200 hover:bg-adam-neutral-950 hover:text-adam-blue/80"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? '发送中…' : '重新发送验证邮件'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmailConfirmation;
