import { Button } from '@/components/ui/button';
import { getLevel, useAuth } from '@/contexts/AuthContext';
import { Loader2, Sparkles } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useTokenPackPurchase } from '@/services/subscriptionService';
import { cn } from '@/lib/utils';
import { DeleteAccountDialog } from '@/components/auth/DeleteAccountDialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import * as Sentry from '@sentry/react';
import { useProfile, useUpdateProfile } from '@/services/profileService';
import { AvatarUpdateDialog } from '@/components/auth/AvatarUpdateDialog';
import { useTokenPacks } from '@/hooks/useTokenPacks';
import { PLAN_DISPLAY_NAMES } from '@/config/plan-features';
import { BILLING_URL, BILLING_UPGRADE_URL } from '@/config/billing';
import { accountUrl, ssoManaged } from '@/lib/supabase';
import { UserAvatar } from '@/components/chat/UserAvatar';

function formatPeriodEnd(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function SettingsView() {
  const { billing, user, resetPassword } = useAuth();
  const level = getLevel(billing);
  const freeTokens = billing?.tokens.free ?? 0;
  const subscriptionTokens = billing?.tokens.subscription ?? 0;
  const purchasedTokens = billing?.tokens.purchased ?? 0;
  const totalTokens = billing?.tokens.total ?? 0;
  const periodEnd = formatPeriodEnd(
    billing?.subscription?.currentPeriodEnd ?? null,
  );
  const { data: profile } = useProfile();
  const { mutate: updateProfile, isPending: isUpdateLoading } =
    useUpdateProfile();
  const { toast } = useToast();
  const [newName, setNewName] = useState(profile?.full_name || '');
  const [editingName, setEditingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { data: tokenPacks = [] } = useTokenPacks();
  const {
    mutate: purchaseTokenPack,
    isPending: isPurchaseLoading,
    variables: purchaseVariables,
  } = useTokenPackPurchase();

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
    }
  }, [editingName]);

  useEffect(() => {
    setNewName(profile?.full_name || '');
  }, [profile?.full_name]);

  const handleUpdateName = () => {
    updateProfile(
      { full_name: newName },
      {
        onSuccess: () => {
          setEditingName(false);
          setNewName(profile?.full_name || '');
          toast({
            title: '成功',
            description: '姓名已更新',
          });
        },
        onError: (e) => {
          Sentry.captureException(e);
          toast({
            title: '错误',
            description: '更新姓名失败',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const handleUpdateNotifications = async (notificationsEnabled: boolean) => {
    updateProfile(
      {
        notifications_enabled: notificationsEnabled,
      },
      {
        onSuccess: () => {
          toast({
            title: '成功',
            description: '通知设置已更新',
          });
        },
        onError: (e) => {
          Sentry.captureException(e);
          toast({
            title: '错误',
            description: '更新通知设置失败',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const { mutate: handleResetPassword, isPending: isResetLoading } =
    useMutation({
      mutationFn: async () => {
        if (!user?.email) throw new Error('User email not found');
        await resetPassword(user?.email);
      },
      onSuccess: () => {
        toast({
          title: '成功',
          description: '密码重置邮件已发送至你的邮箱',
        });
      },
      onError: () => {
        toast({
          title: '错误',
          description: '重置密码失败',
          variant: 'destructive',
        });
      },
    });

  // When SSO owns the identity and an external account page is configured,
  // profile / email / password / delete are managed there (the
  // accounts.google.com model) rather than edited in-app. Self-host (no SSO
  // or no account URL) keeps the native controls. `ssoManaged` is imported from
  // @/lib/supabase so every SSO gate shares one definition.

  const tierLabel = `智造3D ${PLAN_DISPLAY_NAMES[level]}`;

  const tierAccent =
    level === 'free'
      ? 'bg-adam-neutral-700 text-adam-neutral-50'
      : level === 'standard'
        ? 'bg-adam-blue/15 text-adam-blue'
        : 'bg-gradient-to-r from-adam-blue/20 to-fuchsia-500/20 text-adam-neutral-50';

  return (
    <div className="flex min-h-full w-full items-center justify-center bg-adam-background-1 px-6 py-10">
      <div className="w-full max-w-xl">
        <header className="mb-8">
          <h1 className="text-2xl font-medium tracking-tight text-adam-neutral-50">
            设置
          </h1>
          <p className="mt-1 text-sm text-adam-neutral-200">
            管理你的账户、订阅与偏好设置。
          </p>
        </header>

        <div className="flex flex-col gap-4">
          {/* Account */}
          <section className="rounded-xl border border-adam-neutral-800 bg-adam-background-2 p-6">
            <h2 className="mb-5 text-sm font-medium text-adam-neutral-50">
              账户
            </h2>

            {ssoManaged ? (
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <UserAvatar className="h-10 w-10" />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-adam-neutral-50">
                      {profile?.full_name || user?.email}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-adam-neutral-200">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-adam-neutral-800 pt-5">
                  <div className="min-w-0">
                    <div className="text-sm text-adam-neutral-50">管理账户</div>
                    <div className="mt-0.5 text-xs leading-relaxed text-adam-neutral-200">
                      在账户中心更新姓名、邮箱、密码等账户信息。
                    </div>
                  </div>
                  <a
                    href={accountUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <Button variant="dark" className="rounded-full font-light">
                      管理账户
                    </Button>
                  </a>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-adam-neutral-800">
                <div className="flex items-center justify-between gap-4 pb-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <AvatarUpdateDialog />
                    {editingName ? (
                      <Input
                        ref={nameInputRef}
                        value={newName}
                        className="h-9 w-full max-w-xs"
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleUpdateName();
                          }
                        }}
                      />
                    ) : (
                      <div className="min-w-0 truncate text-sm text-adam-neutral-50">
                        {profile?.full_name || user?.email}
                      </div>
                    )}
                  </div>
                  {editingName ? (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <Button
                        onClick={() => handleUpdateName()}
                        variant="light"
                        disabled={isUpdateLoading}
                        className="rounded-full font-light"
                      >
                        {isUpdateLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          '保存'
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingName(false);
                          setNewName(profile?.full_name || '');
                        }}
                        variant="dark"
                        className="rounded-full font-light"
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setEditingName(true)}
                      variant="dark"
                      className="flex-shrink-0 rounded-full font-light"
                    >
                      编辑
                    </Button>
                  )}
                </div>

                <div className="py-5">
                  <div className="text-sm text-adam-neutral-50">邮箱</div>
                  <div className="mt-0.5 truncate text-xs text-adam-neutral-200">
                    {user?.email}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-5">
                  <div className="min-w-0">
                    <div className="text-sm text-adam-neutral-50">密码</div>
                    <div className="mt-0.5 text-xs text-adam-neutral-200">
                      发送重置链接至你的邮箱
                    </div>
                  </div>
                  <Button
                    onClick={() => handleResetPassword()}
                    disabled={isResetLoading}
                    variant="dark"
                    className="flex-shrink-0 rounded-full font-light"
                  >
                    {isResetLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '重置密码'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </section>

          {/* Notifications */}
          <section className="rounded-xl border border-adam-neutral-800 bg-adam-background-2 p-6">
            <h2 className="mb-5 text-sm font-medium text-adam-neutral-50">
              通知
            </h2>

            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm text-adam-neutral-50">回复通知</div>
                <div className="mt-0.5 text-xs leading-relaxed text-adam-neutral-200">
                  长耗时任务完成后收到通知。
                </div>
              </div>
              <Switch
                className="mt-0.5"
                checked={profile?.notifications_enabled ?? false}
                onCheckedChange={handleUpdateNotifications}
              />
            </div>
          </section>

          {/* Billing */}
          <section className="rounded-xl border border-adam-neutral-800 bg-adam-background-2 p-6">
            <h2 className="mb-5 text-sm font-medium text-adam-neutral-50">
              订阅与账单
            </h2>

            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
                      tierAccent,
                    )}
                  >
                    {(level === 'pro' || level === 'max') && (
                      <Sparkles className="h-3 w-3" />
                    )}
                    {tierLabel}
                  </span>
                  {periodEnd && (
                    <span className="text-xs text-adam-neutral-300">
                      {periodEnd} 续订
                    </span>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button
                    asChild
                    className="rounded-full font-light"
                    variant="dark"
                  >
                    <a
                      href={BILLING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {level !== 'free' ? '管理' : '管理账单'}
                    </a>
                  </Button>
                  {level === 'free' && (
                    <Button
                      asChild
                      className="rounded-full font-light"
                      variant="light"
                    >
                      <a
                        href={BILLING_UPGRADE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        升级
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {level !== 'free' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-adam-neutral-200">
                      订阅额度
                    </span>
                    <span className="text-xs tabular-nums text-adam-neutral-50">
                      {subscriptionTokens.toLocaleString()}
                    </span>
                  </div>
                )}
                {freeTokens > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-adam-neutral-200">
                      每日免费额度
                    </span>
                    <span className="text-xs tabular-nums text-adam-neutral-50">
                      {freeTokens.toLocaleString()}
                    </span>
                  </div>
                )}
                {purchasedTokens > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-adam-neutral-200">
                      已购额度
                    </span>
                    <span className="text-xs tabular-nums text-adam-neutral-50">
                      {purchasedTokens.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between border-t border-adam-neutral-800 pt-3">
                  <span className="text-sm text-adam-neutral-50">
                    可用总额度
                  </span>
                  <span className="text-sm font-medium tabular-nums text-adam-neutral-50">
                    {totalTokens.toLocaleString()}
                  </span>
                </div>
              </div>

              {tokenPacks.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-adam-neutral-800 pt-5">
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm text-adam-neutral-50">
                      购买更多额度
                    </div>
                    <div className="text-xs text-adam-neutral-200">
                      永不过期
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {tokenPacks.map((pack) => {
                      const isThisPending =
                        isPurchaseLoading &&
                        purchaseVariables?.priceId === pack.stripePriceId;
                      return (
                        <button
                          key={pack.id}
                          type="button"
                          disabled={isPurchaseLoading}
                          onClick={() =>
                            purchaseTokenPack({ priceId: pack.stripePriceId })
                          }
                          className={cn(
                            'relative flex flex-col items-start rounded-lg border border-adam-neutral-800 bg-adam-background-1 px-3 py-2.5 text-left transition-colors',
                            'hover:border-adam-blue/40 hover:bg-adam-neutral-800/40',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                          )}
                        >
                          {isThisPending && (
                            <Loader2 className="absolute right-2 top-2 h-3.5 w-3.5 animate-spin text-adam-neutral-200" />
                          )}
                          <div className="text-sm font-medium tabular-nums text-adam-neutral-50">
                            {pack.tokenAmount.toLocaleString()}
                          </div>
                          <div className="mt-0.5 text-xs tabular-nums text-adam-neutral-200">
                            ${(pack.priceCents / 100).toFixed(2)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Data & Privacy — when SSO owns the identity, account deletion is
              handled in the Adam account ("Manage account" above), so the
              in-app delete is hidden to avoid a partial, one-sided delete. */}
          {!ssoManaged && (
            <section className="rounded-xl border border-adam-neutral-800 bg-adam-background-2 p-6">
              <h2 className="mb-5 text-sm font-medium text-adam-neutral-50">
                数据与隐私
              </h2>

              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-adam-neutral-50">注销账户</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-adam-neutral-200">
                    永久删除你的账户及所有相关数据。
                  </div>
                </div>
                <DeleteAccountDialog>
                  <Button
                    className="flex-shrink-0 rounded-full font-light"
                    variant="destructive"
                  >
                    删除
                  </Button>
                </DeleteAccountDialog>
              </div>
            </section>
          )}

          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-adam-neutral-300">
            <Link
              to="/terms-of-service"
              className="transition-colors hover:text-adam-neutral-50"
            >
              服务条款
            </Link>
            <span aria-hidden className="text-adam-neutral-700">
              •
            </span>
            <Link
              to="/privacy-policy"
              className="transition-colors hover:text-adam-neutral-50"
            >
              隐私政策
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
