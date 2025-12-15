import { User, Bot, AlertTriangle, ExternalLink, Zap, Ticket, CheckCircle } from 'lucide-react';

export function MessageBubble({ message, onToolAction }) {
  const isUser = message.type === 'user';
  const isError = message.isError;
  const requiresHuman = message.requiresHuman;
  const isToolResult = message.isToolResult;
  const isProcessing = message.isProcessing;
  const actionLinks = message.actionLinks || [];

  const handleActionClick = (link) => {
    if (onToolAction) {
      onToolAction(link);
    }
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
        ${isUser 
          ? 'bg-bain-red' 
          : isToolResult
            ? 'bg-green-500'
            : isProcessing
              ? 'bg-blue-500'
              : requiresHuman 
                ? 'bg-amber-500' 
                : isError 
                  ? 'bg-red-500' 
                  : 'bg-gray-200'
        }
      `}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : isToolResult ? (
          <CheckCircle className="w-4 h-4 text-white" />
        ) : isProcessing ? (
          <Zap className="w-4 h-4 text-white animate-pulse" />
        ) : requiresHuman ? (
          <AlertTriangle className="w-4 h-4 text-white" />
        ) : (
          <Bot className={`w-4 h-4 ${isError ? 'text-white' : 'text-gray-600'}`} />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`
          px-4 py-3 rounded-2xl
          ${isUser 
            ? 'bg-bain-red text-white rounded-tr-sm' 
            : isToolResult
              ? 'bg-green-50 border border-green-200 text-green-800 rounded-tl-sm'
              : isProcessing
                ? 'bg-blue-50 border border-blue-200 text-blue-800 rounded-tl-sm'
                : requiresHuman
                  ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm'
                  : isError
                    ? 'bg-red-50 border border-red-200 text-red-700 rounded-tl-sm'
                    : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          }
        `}>
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">{message.content}</p>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Action Links / Tool Calling Buttons */}
        {actionLinks.length > 0 && !message.actionsExecuted && (
          <div className="mt-3 flex flex-wrap gap-2">
            {actionLinks.map((link, idx) => (
              <button
                key={idx}
                onClick={() => handleActionClick(link)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200 hover:shadow-md
                  ${link.is_tool_action
                    ? 'bg-bain-red text-white hover:bg-bain-red-dark'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-bain-red hover:text-bain-red'
                  }
                `}
              >
                {link.is_tool_action ? (
                  link.tool_call === 'createServiceNowTicket' ? (
                    <Ticket className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )
                ) : (
                  <ExternalLink className="w-4 h-4" />
                )}
                {link.label}
              </button>
            ))}
          </div>
        )}

        {/* Actions Already Executed Indicator */}
        {message.actionsExecuted && (
          <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-700">Action completed</span>
          </div>
        )}

        {/* Human Redirect Banner */}
        {requiresHuman && actionLinks.length === 0 && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-amber-700">Connecting to human agent...</span>
          </div>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && !requiresHuman && !isToolResult && !isProcessing && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.sources.slice(0, 2).map((source, idx) => (
              <span 
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs"
              >
                <ExternalLink className="w-3 h-3" />
                Ticket #{source.ticket_id}
                <span className="text-bain-red font-medium">({Math.round(source.similarity_score * 100)}%)</span>
              </span>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="mt-1 text-xs text-gray-400">
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
