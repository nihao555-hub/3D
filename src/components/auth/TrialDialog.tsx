import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Check } from 'lucide-react';
import FreeTrialButton from '@/components/ui/FreeTrialButton';
import { useSubscriptionService } from '@/services/subscriptionService';
import { useSubscriptionProducts } from '@/hooks/useBillingProducts';

export function TrialDialog({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: products = [] } = useSubscriptionProducts();
  const { mutate: createCheckoutSession, isPending } = useSubscriptionService();

  const proMonthly = products.find(
    (p) =>
      p.subscriptionLevel === 'pro' &&
      p.interval === 'month' &&
      p.productType === 'subscription' &&
      p.active,
  );

  // Derive the credit allowance from the live Pro product rather than
  // hardcoding it, so the dialog can't drift from the actual plan.
  const proCredits = proMonthly?.tokenAmount;

  const handleSubscribe = () => {
    if (!user) {
      navigate({ to: '/signin' });
      return;
    }
    if (!proMonthly) return;
    createCheckoutSession({
      priceId: proMonthly.stripePriceId,
      trialPeriodDays: 7,
      source: 'trial_dialog',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="flex w-[350px] max-w-md flex-col items-center rounded-lg px-10 py-8 text-center md:w-full md:p-16"
        onOpenAutoFocus={(e) => {
          e.preventDefault(); // Prevent any focus behavior when dialog opens
        }}
      >
        <DialogHeader className="w-full">
          <DialogTitle className="text-center text-xl text-adam-text-primary md:text-2xl">
            送你 7 天<span className="text-adam-blue">智造3D 专业版</span>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="w-full text-sm text-adam-neutral-100">
          免费体验 7 天全部专业版功能。
        </DialogDescription>

        <div className="my-6 flex w-full justify-center">
          <FreeTrialButton
            text="开始免费试用"
            onClick={handleSubscribe}
            isPending={isPending}
            disabled={isPending || !proMonthly}
          />
        </div>

        <ul className="space-y-3 text-sm md:text-base">
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-adam-neutral-100" />
            <span className="text-adam-neutral-100">
              {proCredits !== undefined
                ? `每月 ${proCredits.toLocaleString()} 积分`
                : '每月专业版积分'}
            </span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-adam-neutral-100" />
            <span className="text-adam-neutral-100">创始团队一对一支持</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-adam-neutral-100" />
            <span className="text-adam-neutral-100">新功能抢先体验</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="h-4 w-4 text-adam-neutral-100" />
            <span className="text-adam-neutral-100">优质使用体验</span>
          </li>
        </ul>
        <p className="mt-4 w-full text-center text-xs text-adam-neutral-200">
          可随时取消
        </p>
      </DialogContent>
    </Dialog>
  );
}
