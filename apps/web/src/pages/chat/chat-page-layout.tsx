import { useChatAttachmentPanel } from "@/context/use-chat-attachment-panel";
import { cn } from "@/lib/utils";

export function ChatPageColumn({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  const attachmentPanel = useChatAttachmentPanel();

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col transition-[width,opacity,padding] duration-200 ease-out motion-reduce:transition-none",
        attachmentPanel.isFullscreen
          ? "pointer-events-none w-0 flex-none overflow-hidden px-0 opacity-0"
          : "flex-1 px-6",
        centered && "justify-center",
      )}
    >
      {children}
    </div>
  );
}

function partOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export function ChatWelcome({
  userName,
}: {
  userName?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 pb-2 text-center">
      <h2 className="text-[1.75rem] font-semibold tracking-tight">
        {partOfDayGreeting()} {userName?.split(' ')[0] ?? "there"}, how can I help?
      </h2>
    </div>
  );
}
