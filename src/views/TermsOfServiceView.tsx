import { ScrollArea } from '@/components/ui/scroll-area';

export function TermsOfServiceView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-adam-bg-dark p-4">
      <div className="w-full max-w-4xl">
        <div className="rounded-lg bg-adam-bg-secondary-dark p-8 shadow-md">
          <div className="mb-8 flex flex-col items-center justify-center">
            <span className="mb-4 text-2xl font-semibold tracking-tight text-adam-text-primary">
              智造3D
            </span>
            <h1 className="text-center text-3xl font-semibold text-adam-text-primary">
              服务条款
            </h1>
            <p className="mt-2 text-gray-400">生效日期：2025 年 2 月 7 日</p>
          </div>

          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-6">
              <section>
                <h2 className="mb-3 text-xl font-semibold text-adam-text-primary">
                  1. 条款的接受
                </h2>
                <p className="text-gray-400">
                  访问并使用智造3D
                  平台（以下简称"本平台"）即表示你同意受本服务条款的约束。如你不同意本条款的任何内容，请停止使用本平台。
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-adam-text-primary">
                  2. 服务说明
                </h2>
                <p className="text-gray-400">
                  本平台是一款基于人工智能的工业级三维建模服务，支持用户创建、编辑和生成
                  3D
                  模型。服务内容包括后续推出的全部功能、更新与新版本，具体以平台实际提供为准。
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-adam-text-primary">
                  3. 账号与使用规范
                </h2>
                <div className="space-y-3 text-gray-400">
                  <p>3.1 使用本平台的部分功能需要注册账号。</p>
                  <p>
                    3.2 你应妥善保管账号凭据，并对账号下发生的全部活动承担责任。
                  </p>
                  <p>3.3 注册时应提供真实、准确、完整的信息。</p>
                  <p>
                    3.4
                    你承诺不将本平台用于任何违法用途，不侵犯他人知识产权，不尝试未经授权访问或干扰平台的正常运行，不上传或传播恶意代码及违规内容。
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-adam-text-primary">
                  4. 用户内容与知识产权
                </h2>
                <div className="space-y-3 text-gray-400">
                  <p>4.1 你使用本平台创建的内容，其知识产权归你所有。</p>
                  <p>
                    4.2
                    为向你提供服务，你授权本平台在必要范围内托管、存储和展示你的内容。
                  </p>
                  <p>4.3 你应确保对所创建或分享的内容拥有必要的合法权利。</p>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-adam-text-primary">
                  5. 订阅与付费
                </h2>
                <div className="space-y-3 text-gray-400">
                  <p>5.1 本平台的部分功能需要付费订阅后方可使用。</p>
                  <p>5.2 除法律另有规定外，已支付的订阅费用不予退还。</p>
                  <p>
                    5.3 本平台保留调整订阅价格的权利，调整前将以适当方式通知。
                  </p>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-adam-text-primary">
                  6. 服务变更与终止
                </h2>
                <div className="space-y-3 text-gray-400">
                  <p>
                    6.1 如你违反本条款，本平台有权随时中止或终止你对服务的访问。
                  </p>
                  <p>6.2 你可以按照平台内的指引随时注销账号、终止使用。</p>
                </div>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-adam-text-primary">
                  7. 免责声明与责任限制
                </h2>
                <p className="text-gray-400">
                  本平台按"现状"提供服务，不作任何明示或默示的保证，亦不保证服务不中断或无错误。在法律允许的最大范围内，本平台不对因使用服务而产生的任何间接、附带、特殊或惩罚性损失承担责任。
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-xl font-semibold text-adam-text-primary">
                  8. 条款的变更
                </h2>
                <p className="text-gray-400">
                  本平台可能不时修订本条款。发生重大变更时，我们将通过平台公告或其他适当方式通知你；继续使用服务即视为你接受修订后的条款。
                </p>
              </section>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
