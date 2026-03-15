import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 - Cloyee",
};

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">개인정보처리방침</h1>
        <p className="text-sm text-muted-foreground mt-1">최종 수정일: 2026년 3월 15일</p>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Cloyee(이하 &quot;서비스&quot;)는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관련 법령을 준수합니다.
        본 방침은 서비스 이용 시 수집되는 개인정보의 처리에 관한 사항을 안내합니다.
      </p>

      <Section title="1. 수집하는 개인정보 항목">
        <p>서비스는 Google OAuth 로그인 방식을 통해 다음 항목을 수집합니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>이름 (Google 계정 표시 이름)</li>
          <li>이메일 주소</li>
          <li>프로필 사진 URL</li>
        </ul>
        <p>서비스 이용 과정에서 다음 정보가 추가로 생성·저장됩니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>학습 세션 기록 (질문·답변 내용, 카테고리, 점수)</li>
          <li>서비스 이용 일시</li>
        </ul>
      </Section>

      <Section title="2. 개인정보 수집 및 이용 목적">
        <ul className="list-disc pl-5 space-y-1">
          <li>서비스 회원 식별 및 로그인 처리</li>
          <li>학습 기록 저장 및 통계 제공</li>
          <li>서비스 품질 개선</li>
        </ul>
      </Section>

      <Section title="3. 개인정보 보유 및 이용 기간">
        <p>
          수집된 개인정보는 회원 탈퇴 시까지 보유합니다.
          탈퇴 요청 시 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p>
          서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.
        </p>
        <p>
          단, 학습 기능 제공을 위해 Anthropic의 Claude API를 사용합니다.
          이 과정에서 사용자가 입력한 학습 내용(코드, 질문 등)이 API 요청에 포함될 수 있으며,
          이는 AI 응답 생성 목적으로만 사용됩니다. 이름, 이메일, 프로필 사진 등 식별 정보는 전달되지 않습니다.
        </p>
      </Section>

      <Section title="5. 개인정보 처리 위탁">
        <ul className="list-disc pl-5 space-y-1">
          <li>수탁업체: Supabase Inc. — 회원 인증 및 데이터 저장</li>
          <li>수탁업체: Vercel Inc. — 서비스 호스팅</li>
          <li>수탁업체: Anthropic PBC — AI 학습 기능 제공 (학습 입력 내용에 한함)</li>
        </ul>
      </Section>

      <Section title="6. 이용자의 권리">
        <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>개인정보 열람 요청</li>
          <li>개인정보 수정 요청</li>
          <li>개인정보 삭제(회원 탈퇴) 요청</li>
        </ul>
      </Section>

      <Section title="7. 개인정보 보호책임자">
        <p>개인정보 처리에 관한 문의는 서비스 내 문의 채널을 통해 연락하시기 바랍니다.</p>
      </Section>

      <div className="pt-4 border-t border-border">
        <Link href="/terms" className="text-xs text-primary underline underline-offset-2">
          이용약관 보기
        </Link>
      </div>
    </div>
  );
}
