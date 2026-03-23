import { MessageSquare } from "lucide-react";

export default function AdminFeedbackPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">피드백</h1>
        <p className="text-sm text-muted-foreground mt-1">사용자 피드백 목록</p>
      </div>

      <div className="rounded-lg border border-border bg-white dark:bg-neutral-900 flex flex-col items-center justify-center py-20 gap-3 text-center">
        <MessageSquare size={36} className="text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">피드백 기능 준비 중입니다.</p>
        <p className="text-xs text-muted-foreground">feedback 테이블 구현 후 활성화됩니다.</p>
      </div>
    </div>
  );
}
