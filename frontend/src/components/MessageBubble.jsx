import { User, Bot, AlertTriangle, ExternalLink } from 'lucide-react';

export function MessageBubble({ message }) {
  const isUser = message.type === 'user';
  const isError = message.isError;
  const requiresHuman = message.requiresHuman;

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
        ${isUser 
          ? 'bg-primary-500' 
          : requiresHuman 
            ? 'bg-amber-500' 
            : isError 
              ? 'bg-red-500' 
              : 'bg-dark-700'
        }
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : requiresHuman ? (
          <AlertTriangle className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-3 rounded-2xl
          ${isUser 
            ? 'bg-primary-500 text-white rounded-tr-sm' 
            : requiresHuman
              ? 'bg-amber-500/10 border border-amber-500/30 text-amber-100 rounded-tl-sm'
              : isError
                ? 'bg-red-500/10 border border-red-500/30 text-red-200 rounded-tl-sm'
                : 'bg-dark-800 text-dark-100 rounded-tl-sm'
          }
        `}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Human Redirect Banner */}
        {requiresHuman && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-amber-300">Connecting to human agent...</span>
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && !requiresHuman && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.slice(0, 2).map((source, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-dark-800 text-dark-400 text-xs"
              >
                <ExternalLink className="w-3 h-3" />
                Ticket #{source.ticket_id}
                <span className="text-primary-400">({Math.round(source.similarity_score * 100)}%)</span>
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="mt-1 text-xs text-dark-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

