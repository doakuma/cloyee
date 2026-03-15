import Link from "next/link";

export const metadata = {
  title: "이용약관 - Cloyee",
};

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">이용약관</h1>
        <p className="text-sm text-muted-foreground mt-1">최종 수정일: 2026년 3월 15일</p>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        본 약관은 Cloyee(이하 &quot;서비스&quot;)의 이용에 관한 조건 및 절차를 규정합니다.
        서비스를 이용함으로써 본 약관에 동의하는 것으로 간주합니다.
      </p>

      <Section title="제1조 (서비스 소개)">
        <p>
          Cloyee는 인공지능(AI)을 활용한 소크라테스식 코딩 학습 서비스로,
          사용자가 대화를 통해 프로그래밍 개념을 학습하고 코드 리뷰를 받을 수 있도록 지원합니다.
        </p>
      </Section>

      <Section title="제2조 (이용 자격)">
        <p>
          Google 계정을 보유한 누구나 서비스를 이용할 수 있습니다.
          만 14세 미만의 이용자는 법정대리인의 동의가 필요합니다.
        </p>
      </Section>

      <Section title="제3조 (서비스 이용)">
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스는 학습 목적으로만 이용해야 합니다.</li>
          <li>타인의 개인정보, 저작권이 있는 코드를 무단으로 입력하는 행위를 금지합니다.</li>
          <li>서비스를 통해 생성된 AI 응답을 상업적 목적으로 재배포하는 행위를 금지합니다.</li>
          <li>서비스의 정상적인 운영을 방해하는 행위를 금지합니다.</li>
        </ul>
      </Section>

      <Section title="제4조 (AI 생성 콘텐츠 면책)">
        <p>
          서비스는 Anthropic의 Claude API를 기반으로 AI가 생성한 학습 콘텐츠(질문, 피드백, 코드 리뷰 등)를 제공합니다.
        </p>
        <p>
          AI 생성 콘텐츠는 교육 목적으로 제공되며, 정확성·완전성을 보장하지 않습니다.
          AI 응답의 오류로 인해 발생한 직접적·간접적 손해에 대해 서비스는 법적 책임을 지지 않습니다.
        </p>
        <p>
          AI가 제공하는 코드나 설명을 실제 프로덕션 환경에 사용하기 전 반드시 검토하시기 바랍니다.
        </p>
      </Section>

      <Section title="제5조 (서비스 변경 및 중단)">
        <p>
          서비스는 운영 정책, 기술적 사유, 또는 외부 API(Claude, Supabase 등) 정책 변경에 따라
          서비스의 전부 또는 일부를 변경하거나 중단할 수 있습니다.
        </p>
        <p>
          서비스 변경 또는 중단 시, 가능한 경우 서비스 내 공지를 통해 사전 안내합니다.
          불가피한 상황에 의한 갑작스러운 중단의 경우 손해배상 책임을 지지 않습니다.
        </p>
      </Section>

      <Section title="제6조 (지식재산권)">
        <p>
          서비스의 로고, UI, 브랜드 요소 등의 지식재산권은 서비스 운영자에게 귀속됩니다.
          사용자가 서비스에 입력한 콘텐츠(코드, 텍스트 등)의 권리는 사용자에게 있습니다.
        </p>
      </Section>

      <Section title="제7조 (면책 조항)">
        <p>
          서비스는 천재지변, 네트워크 장애, 외부 서비스(Claude API, Supabase 등) 장애 등
          불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
        </p>
      </Section>

      <Section title="제8조 (약관 변경)">
        <p>
          본 약관은 서비스 정책 변경에 따라 수정될 수 있습니다.
          변경 시 서비스 내 공지를 통해 안내하며, 변경 후 계속 이용 시 변경된 약관에 동의한 것으로 봅니다.
        </p>
      </Section>

      <Section title="제9조 (준거법 및 분쟁 해결)">
        <p>
          본 약관은 대한민국 법령을 준거법으로 하며, 서비스 이용과 관련한 분쟁은 관련 법령에 따라 해결합니다.
        </p>
      </Section>

      <div className="pt-4 border-t border-border">
        <Link href="/privacy" className="text-xs text-primary underline underline-offset-2">
          개인정보처리방침 보기
        </Link>
      </div>
    </div>
  );
}
