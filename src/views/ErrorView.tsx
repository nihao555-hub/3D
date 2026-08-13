import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import * as Sentry from '@sentry/react';
import { useEffect } from 'react';

export function ErrorView({ error }: { error?: unknown }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-adam-bg-secondary-dark">
      <h1 className="text-2xl font-bold text-adam-text-primary">
        哎呀，出错了
      </h1>
      <p className="text-center text-adam-text-secondary">
        很抱歉，加载此页面时发生了错误。
        <br />
        请稍后重试，或联系我们协助解决。
      </p>
      <Button onClick={() => navigate({ to: '/' })}>返回首页</Button>
    </div>
  );
}
