import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useNavigate } from '@tanstack/react-router';
import { supabase, ssoProvider } from '@/lib/supabase';
import * as Sentry from '@sentry/react';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import posthog from 'posthog-js';
import { apiJson } from '@/services/api';

type CancellationFeedback =
  | 'customer_service'
  | 'low_quality'
  | 'missing_features'
  | 'other'
  | 'switched_service'
  | 'too_complex'
  | 'too_expensive'
  | 'unused';

export const DeleteAccountDialog = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [confirmText, setConfirmText] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedReason, setSelectedReason] =
    useState<CancellationFeedback | null>(null);
  const { mutate: deleteUser, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      posthog.capture('delete_account_called', {
        reason: selectedReason,
      });
      await apiJson('delete-user', {
        method: 'POST',
        body: JSON.stringify({ reason: selectedReason }),
      });
    },
    onSuccess: async () => {
      // In SSO mode root is the app's only auth surface, so the deletion
      // flow lands there. Navigate BEFORE the session dies: this dialog
      // lives on a guarded route, and the AuthGuard would otherwise fire
      // the provider redirect and sign the just-deleted user back in.
      if (ssoProvider) {
        await navigate({ to: '/' });
      }
      // Sign out locally and redirect after deletion
      supabase.auth.signOut();
    },
    onError: (error) => {
      Sentry.captureException(error);
      toast({
        title: '删除失败',
        description: '账号删除失败，请重试或联系客服支持。',
        variant: 'destructive',
      });
    },
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-md rounded-3xl">
        {step === 1 ? (
          <div className="flex flex-col gap-16">
            <AlertDialogHeader className="text-center sm:text-center">
              <AlertDialogTitle className="w-full">
                很遗憾看到你离开 :(
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="flex flex-col gap-6">
              <div className="text-sm">是什么原因让你决定取消？</div>
              <RadioGroup
                value={selectedReason}
                className="flex flex-col gap-6"
              >
                <label className="flex items-center gap-3 text-sm">
                  <RadioGroupItem
                    onClick={() => setSelectedReason('too_expensive')}
                    value="too_expensive"
                  />
                  价格太贵
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <RadioGroupItem
                    onClick={() => setSelectedReason('missing_features')}
                    value="missing_features"
                  />
                  缺少需要的功能
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <RadioGroupItem
                    onClick={() => setSelectedReason('low_quality')}
                    value="low_quality"
                  />
                  质量不佳或存在缺陷
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <RadioGroupItem
                    onClick={() => setSelectedReason('unused')}
                    value="unused"
                  />
                  不再需要了
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <RadioGroupItem
                    onClick={() => setSelectedReason('switched_service')}
                    value="switched_service"
                  />
                  已找到其他工具
                </label>
              </RadioGroup>
            </div>
            <div className="grid w-full grid-cols-2 gap-5">
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={() => {
                  setIsOpen(false);
                  setConfirmText('');
                  setSelectedReason(null);
                  setStep(1);
                }}
              >
                取消
              </Button>
              <Button
                variant="black"
                className="w-full rounded-full"
                onClick={() => setStep(2)}
                disabled={!selectedReason}
              >
                下一步
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-16">
            <AlertDialogHeader className="text-center sm:text-center">
              <AlertDialogTitle className="w-full">
                确定要删除吗？
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4">
              <p>删除账号意味着：</p>
              <div className="rounded-lg bg-adam-neutral-950 p-4 text-adam-neutral-100">
                <ul className="list-disc space-y-2 pl-5 text-sm">
                  <li>删除账号为永久操作，无法撤销或恢复。</li>
                  <li>
                    你的数据将在 30
                    天内删除；在法律要求或允许的情况下，我们可能在更长期限内保留少量必要数据。
                  </li>
                </ul>
              </div>
            </div>
            <div className="space-y-2">
              <p>
                请输入{' '}
                <span className="font-semibold text-red-500">DELETE</span>{' '}
                以确认删除
              </p>
              <Input
                className="rounded-none border-x-0 border-b border-t-0 border-adam-neutral-200 shadow-none ring-0 focus:border-adam-neutral-200 focus:ring-0"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <div className="grid w-full grid-cols-2 gap-5">
              <Button
                variant="secondary"
                className="w-full rounded-full"
                onClick={() => {
                  setIsOpen(false);
                  setConfirmText('');
                  setSelectedReason(null);
                  setStep(1);
                }}
              >
                取消
              </Button>
              <Button
                variant="destructive"
                className="w-full rounded-full"
                disabled={confirmText !== 'DELETE' || isDeleting}
                onClick={() => deleteUser()}
              >
                删除账号
              </Button>
            </div>
          </div>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
};
