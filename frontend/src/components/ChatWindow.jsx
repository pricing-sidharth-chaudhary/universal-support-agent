import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';

export function ChatWindow({ 
  agent,
  messages, 
  isLoading, 
  onSend, 
  onBackClick
}) {
  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        agent={agent}
        onBackClick={onBackClick} 
      />
      
      <MessageList 
        messages={messages} 
        isLoading={isLoading} 
      />
      
      <ChatInput 
        onSend={onSend} 
        isLoading={isLoading}
        placeholder={`Ask ${agent?.name || 'the agent'} a question...`}
      />
    </div>
  );
}
