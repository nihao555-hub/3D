import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function UpdatePasswordView() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  const { mutate: handleUpdatePassword, isPending: isUpdatingPassword } =
    useMutation({
      mutationFn: updatePassword,
      onSuccess: () => {
        toast({
          title: '更新成功',
          description: '密码已更新',
        });
        navigate({ to: '/' });
      },
      onError: () => {
        toast({
          title: '错误',
          description: '密码更新失败，请稍后重试',
          variant: 'destructive',
        });
      },
    });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({
        title: '错误',
        description: '两次输入的密码不一致',
        variant: 'destructive',
      });
      return;
    }
    handleUpdatePassword(password);
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
              更新密码
            </h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-adam-text-primary">
                新密码
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入新密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 bg-adam-bg-dark text-adam-text-primary placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-adam-text-primary"
              >
                确认密码
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="border-gray-300 bg-adam-bg-dark text-adam-text-primary placeholder:text-gray-500"
              />
            </div>

            <Button
              type="submit"
              variant="light"
              className="w-full"
              disabled={isUpdatingPassword}
            >
              {isUpdatingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中…
                </>
              ) : (
                '更新密码'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
