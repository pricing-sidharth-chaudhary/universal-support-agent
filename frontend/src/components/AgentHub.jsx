import { DollarSign, Database, Plug, ArrowRight, Loader2 } from 'lucide-react';

const iconMap = {
  DollarSign: DollarSign,
  Database: Database,
  Plug: Plug,
};

function AgentCard({ agent, onSelect }) {
  const Icon = iconMap[agent.icon] || Database;
  const isReady = agent.is_ready;

  return (
    <div
      onClick={() => isReady && onSelect(agent)}
      className={`
        group relative p-6 rounded-2xl transition-all duration-300
        ${isReady 
          ? 'bg-white hover:bg-gray-50 cursor-pointer border border-gray-200 hover:border-bain-red/50 hover:shadow-lg' 
          : 'bg-gray-100 border border-gray-200 opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-colors
        ${isReady 
          ? 'bg-bain-red/10 text-bain-red group-hover:bg-bain-red group-hover:text-white' 
          : 'bg-gray-200 text-gray-400'
        }
      `}>
        <Icon className="w-7 h-7" />
      </div>

      {/* Content */}
      <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
        {agent.name}
      </h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">
        {agent.description}
      </p>

      {/* Status */}
      <div className="flex items-center justify-between">
        <span className={`
          text-xs px-2 py-1 rounded-full
          ${isReady 
            ? 'bg-bain-red/10 text-bain-red' 
            : 'bg-gray-200 text-gray-500'
          }
        `}>
          {agent.tickets_count} tickets indexed
        </span>
        
        {isReady && (
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-bain-red group-hover:translate-x-1 transition-all" />
        )}
      </div>

      {/* Not ready overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-2xl">
          <span className="text-xs text-gray-500">Indexing...</span>
        </div>
      )}
    </div>
  );
}

export function AgentHub({ agents, onSelectAgent, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-10 h-10 text-bain-red animate-spin mb-4" />
        <p className="text-gray-500">Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="text-center mb-8 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bain-red/10 text-bain-red text-sm mb-4">
          <Database className="w-4 h-4" />
          <span>AI Support Hub</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
          Select an Agent
        </h1>
        <p className="text-gray-500 max-w-md mx-auto">
          Choose a specialized AI agent to assist with your inquiry. Each agent is trained on domain-specific knowledge.
        </p>
      </div>

      {/* Agent Grid */}
      <div className="flex-1 px-6 pb-6 overflow-auto">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onSelect={onSelectAgent}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 text-center bg-gray-50">
        <p className="text-xs text-gray-400">
          Powered by Bain & Company AI Platform
        </p>
      </div>
    </div>
  );
}
