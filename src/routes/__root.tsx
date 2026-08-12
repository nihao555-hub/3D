import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router';
import App from '@/App';
import appCss from '@/index.css?url';

const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: '智造3D — AI 工业级三维建模平台' },
      {
        name: 'description',
        content:
          '用自然语言描述，一键生成可制造的参数化 3D 模型，支持 STL / SCAD / DXF 导出。',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  component: RootComponent,
  errorComponent: ({ error }) => (
    <RootDocument>
      <App error={error} />
    </RootDocument>
  ),
});

function RootComponent() {
  return (
    <RootDocument>
      <App />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href={assetUrl('zhizao-icon.svg')}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
