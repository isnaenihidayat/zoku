import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { PromptInputProvider } from "@/components/ai-elements/prompt-input";
import { ChatAttachmentPanelProvider } from "@/context/chat-attachment-panel-context";
import { ArtifactStreamingPanelBridge } from "@/components/chat/artifact-streaming-panel-bridge";
import { formatAgentQuestionnaireAnswersMessage } from "@zoku/core/agent-questionnaire";
import { formatSessionChannelLabel } from "@/lib/chat-history";
import { extractModelId } from "@/lib/models";
import { usePostTurnSkillReviewOverlay } from "@/hooks/use-post-turn-skill-review-overlay";
import { useAuth } from "@/context/use-auth";
import { ChatPageColumn, ChatWelcome } from "@/pages/chat/chat-page-layout";
import { useEffect, useState } from "react";
import type { ChatMode } from "@zoku/core/contract";
import type { ChatPageState } from "@/pages/chat/use-chat-page";

export function ChatPageContent(state: ChatPageState) {
  const { user } = useAuth();
  const {
    session,
    messages,
    profileId,
    activeProfile,
    availableSkills,
    chatStatus,
    busy,
    lastSuccessfulTurnAt,
    turnStartedAt,
    canStop,
    error,
    composerDraft,
    setComposerDraft,
    queuedMessages,
    branchingMessageId,
    showOfflineHint,
    health,
    providerModelGroups,
    currentModelSelection,
    activeModelSupportsVision,
    showThinking,
    thinkingEffortVisible,
    thinkingEffort,
    thinkingEffortDisabled,
    readOnlySession,
    isEmptyState,
    composerDisabled,
    sessionChannel,
    contextUsage,
    handleModelChange,
    handleThinkingEffortChange,
    renderModelLabel,
    handleBranchMessage,
    handleTryAgainMessage,
    sendMessage,
    stopStreaming,
    navigateSetup,
    agentTodos,
    agentQuestionnaire,
    pendingToolApproval,
    resolveToolApproval,
  } = state;

  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    const stored = typeof localStorage !== "undefined" ? localStorage.getItem("zoku:chat-mode") : null;
    return stored === "plan" || stored === "ask" || stored === "full" ? stored : "full";
  });

  useEffect(() => {
    localStorage.setItem("zoku:chat-mode", chatMode);
  }, [chatMode]);

  const { banner: skillReviewBanner } = usePostTurnSkillReviewOverlay({
    sessionId: session?.id ?? null,
    profile: activeProfile,
    sessionChannel,
    lastSuccessfulTurnAt,
    readOnlySession,
  });

  const readOnlyBanner = readOnlySession ? (
    <p className="mb-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      View-only {formatSessionChannelLabel(sessionChannel)} conversation. Reply from{" "}
      {formatSessionChannelLabel(sessionChannel)}.
    </p>
  ) : null;

  const approvalBanner =
    pendingToolApproval && session ? (
      <div className="mb-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
        <div className="font-medium text-amber-700 dark:text-amber-300">
          {pendingToolApproval.tool} is waiting for your approval
        </div>
        <div className="mt-1 max-h-20 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
          {JSON.stringify(pendingToolApproval.input, null, 2)}
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
            onClick={() => void resolveToolApproval("approve")}
          >
            Approve
          </button>
          <button
            type="button"
            className="rounded-md bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground hover:bg-destructive/90"
            onClick={() => void resolveToolApproval("reject")}
          >
            Reject
          </button>
        </div>
      </div>
    ) : null;

  const composer = (
    <PromptInputProvider key={composerDraft || "empty"} initialInput={composerDraft}>
      {approvalBanner}
      {skillReviewBanner}
      {readOnlyBanner}
      <ChatComposer
        className={isEmptyState && !error ? "py-0 [&>p:first-child]:min-h-0 z-10" : "py-0 z-10"}
        chatStatus={chatStatus}
        busy={busy}
        canStop={canStop}
        disabled={composerDisabled}
        error={error}
        contextUsage={contextUsage}
        availableSkills={availableSkills}
        showTips={isEmptyState}
        showOfflineHint={showOfflineHint}
        providerConfigured={health?.providerConfigured}
        onNavigateSetup={navigateSetup}
        providerModelGroups={providerModelGroups}
        profileModelId={extractModelId(activeProfile?.model)}
        currentModelSelection={currentModelSelection}
        primarySupportsVision={activeModelSupportsVision}
        onModelChange={handleModelChange}
        thinkingEffortVisible={thinkingEffortVisible}
        thinkingEffort={thinkingEffort}
        thinkingEffortDisabled={thinkingEffortDisabled}
        onThinkingEffortChange={handleThinkingEffortChange}
        renderModelLabel={renderModelLabel}
        mode={chatMode}
        onModeChange={setChatMode}
        todos={agentTodos}
        questionnaire={agentQuestionnaire}
        queuedMessages={queuedMessages}
        onSubmitQuestionnaire={(answers) => {
          setComposerDraft("");
          void sendMessage(formatAgentQuestionnaireAnswersMessage(answers), [], {
            questionnaireAnswers: answers,
          });
        }}
        onSubmit={(text, files) => {
          setComposerDraft("");
          void sendMessage(text, files, { mode: chatMode });
        }}
        onStop={stopStreaming}
      />
    </PromptInputProvider>
  );

  if (isEmptyState) {
    return (
      <ChatAttachmentPanelProvider key={session?.id ?? "new"}>
        <ChatPageColumn centered>
          <div className="mx-auto mb-12 flex w-full max-w-3xl flex-col gap-1">
            <ChatWelcome userName={user?.name ?? user?.email ?? "there"} />
            {composer}
          </div>
        </ChatPageColumn>
      </ChatAttachmentPanelProvider>
    );
  }

  return (
    <ChatAttachmentPanelProvider key={session?.id ?? "new"}>
      <ArtifactStreamingPanelBridge messages={messages} profileId={profileId} />
      <ChatPageColumn>
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ChatMessageList
              messages={messages}
              profileId={profileId}
              showThinking={showThinking}
              modelLabel={
                currentModelSelection ? renderModelLabel(currentModelSelection) : null
              }
              branchingMessageId={branchingMessageId}
              actionsDisabled={busy || readOnlySession}
              streamActive={busy}
              turnStartedAt={turnStartedAt}
              onBranchMessage={(message) => void handleBranchMessage(message)}
              onRetryMessage={(message) => void handleTryAgainMessage(message)}
            />
          </div>

          <div className="sticky bottom-0 z-10 mt-auto w-full shrink-0 bg-background/95 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
            {composer}
          </div>
        </div>
      </ChatPageColumn>
    </ChatAttachmentPanelProvider>
  );
}
