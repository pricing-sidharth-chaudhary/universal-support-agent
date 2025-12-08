import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function ChatWindow({ 
  ticketCount, 
  messages, 
  isLoading, 
  onSend, 
  onReindexClick,
  isLocked 
}) {
  return (
    <div className={`
      flex flex-col h-full rounded-2xl overflow-hidden
      glass transition-all duration-500
      ${isLocked ? 'opacity-30 blur-sm pointer-events-none' : 'glow-primary'}
    `}>
      <ChatHeader 
        ticketCount={ticketCount} 
        onReindexClick={onReindexClick} 
      />
      
      <MessageList 
        messages={messages} 
        isLoading={isLoading} 
      />
      
      <ChatInput 
        onSend={onSend} 
        isLoading={isLoading}
        disabled={isLocked || ticketCount === 0}
      />
    </div>
  );
}

