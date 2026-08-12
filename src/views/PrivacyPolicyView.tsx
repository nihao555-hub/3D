import { ScrollArea } from '@/components/ui/scroll-area';

export function PrivacyPolicyView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-adam-bg-dark p-4">
      <div className="w-full max-w-4xl">
        <div className="rounded-lg bg-adam-bg-secondary-dark p-8 shadow-md">
          <div className="mb-8 flex flex-col items-center justify-center">
            <span className="mb-4 text-2xl font-semibold tracking-tight text-white">
              智造3D
            </span>
            <h1 className="text-center text-3xl font-semibold text-white">
              隐私政策
            </h1>
            <p className="mt-2 text-gray-400">生效日期：2025 年 2 月 7 日</p>
          </div>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-6">
              <section>
                <h2 className="mb-3 text-xl font-semibold text-white">概述</h2>
                <p className="text-gray-400">
                  本隐私政策说明智造3D
                  平台（以下简称"本平台"或"我们"）在你使用我们的网站与服务时，如何收集、使用和共享你的信息。使用本平台即表示你同意我们按照本政策处理相关信息。
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  我们收集的信息
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="mb-2 text-lg font-medium text-white">
                      你主动提供的信息
                    </h3>
                    <p className="mb-2 text-gray-400">
                      在注册和使用本平台的过程中，我们会收集你直接提供的信息，包括：
                    </p>
                    <ul className="ml-4 list-inside list-disc text-gray-400">
                      <li>账号信息（姓名、邮箱地址）</li>
                      <li>使用第三方账号登录时产生的认证信息</li>
                      <li>你在平台中创建的内容</li>
                      <li>你与我们的沟通记录</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="mb-2 text-lg font-medium text-white">
                      自动收集的信息
                    </h3>
                    <p className="mb-2 text-gray-400">
                      在你使用服务时，我们会自动收集部分信息，包括：
                    </p>
                    <ul className="ml-4 list-inside list-disc text-gray-400">
                      <li>日志数据（IP 地址、浏览器类型、访问页面）</li>
                      <li>设备信息</li>
                      <li>使用情况信息</li>
                      <li>Cookie 及类似技术产生的信息</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  信息的使用
                </h2>
                <p className="text-gray-400">
                  我们仅在提供、维护和改进服务所必需的范围内使用上述信息，包括：处理你的建模请求、保障账号与服务安全、优化产品体验，以及在你同意的前提下向你发送服务通知。
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  信息的共享
                </h2>
                <p className="text-gray-400">
                  除为提供服务所必需的技术服务商（如云存储、支付处理）外，我们不会向任何第三方出售或出租你的个人信息。在法律法规要求或保护平台及用户合法权益所必需时，我们可能依法披露相关信息。
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  信息的存储与安全
                </h2>
                <p className="text-gray-400">
                  我们采取加密传输、访问控制等合理的技术与管理措施保护你的信息安全，并仅在实现本政策所述目的所必需的期限内保存你的信息。账号注销后，我们将按照法律规定删除或匿名化处理相关数据。
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-white">
                  你的权利
                </h2>
                <p className="text-gray-400">
                  你有权访问、更正、删除你的个人信息，或撤回相关授权。你可以通过账号设置页面行使上述权利；如需进一步协助，可随时联系平台支持。
                </p>
              </section>

              <section className="mb-8">
                <h2 className="mb-3 text-xl font-semibold text-white">
                  政策的更新
                </h2>
                <p className="text-gray-400">
                  我们可能不时更新本隐私政策。发生重大变更时，我们将通过平台公告或其他适当方式通知你。请定期查阅本页面以了解最新内容。
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
