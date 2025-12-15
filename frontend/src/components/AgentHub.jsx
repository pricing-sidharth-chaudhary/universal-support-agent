import { DollarSign, Database, Plug, Compass, ArrowRight, Loader2 } from 'lucide-react';

const iconMap = {
  DollarSign: DollarSign,
  Database: Database,
  Plug: Plug,
  Compass: Compass,
};

function AgentCard({ agent, onSelect, isHighlighted }) {
  const Icon = iconMap[agent.icon] || Database;
  const isReady = agent.is_ready;

  return (
    <div
      onClick={() => isReady && onSelect(agent)}
      className={`
        group relative p-4 rounded-xl transition-all duration-300
        ${isReady 
          ? isHighlighted
            ? 'bg-bain-red/5 hover:bg-bain-red/10 cursor-pointer border-2 border-bain-red hover:shadow-lg ring-2 ring-bain-red/20'
            : 'bg-white hover:bg-gray-50 cursor-pointer border border-gray-200 hover:border-bain-red/50 hover:shadow-lg'
          : 'bg-gray-100 border border-gray-200 opacity-60 cursor-not-allowed'
        }
      `}
    >
      {/* Recommended Badge */}
      {isHighlighted && (
        <div className="absolute -top-2 -right-2 bg-bain-red text-white text-xs px-2 py-1 rounded-full font-medium">
          Start Here
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
          ${isReady 
            ? isHighlighted
              ? 'bg-bain-red text-white'
              : 'bg-bain-red/10 text-bain-red group-hover:bg-bain-red group-hover:text-white'
            : 'bg-gray-200 text-gray-400'
          }
        `}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-base font-semibold text-gray-900">
              {agent.name}
            </h3>
            {isReady && (
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-bain-red group-hover:translate-x-1 transition-all flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 mb-2 line-clamp-2">
            {agent.description}
          </p>
          <span className={`
            text-xs px-2 py-0.5 rounded-full inline-block
            ${isReady 
              ? 'bg-bain-red/10 text-bain-red' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {agent.tickets_count} topics
          </span>
        </div>
      </div>

      {/* Not ready overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
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

  // Sort agents to put Universal first
  const sortedAgents = [...agents].sort((a, b) => {
    if (a.id === 'universal') return -1;
    if (b.id === 'universal') return 1;
    return 0;
  });

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="text-center py-6 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bain-red/10 text-bain-red text-sm mb-3">
          <img src="/logo.svg" alt="Logo" className="w-5 h-5" />
          <span>AI Support Hub</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">
          How can we help you?
        </h1>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Start with Universal Support for general queries, or select a specialized agent for domain-specific help.
        </p>
      </div>

      {/* Agent Grid - 2x2 layout */}
      <div className="flex-1 px-6 pb-4 flex items-center">
        <div className="grid gap-4 grid-cols-2 w-full max-w-4xl mx-auto">
          {sortedAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onSelect={onSelectAgent}
              isHighlighted={agent.id === 'universal'}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-gray-100 text-center bg-gray-50">
        <p className="text-xs text-gray-400">
          Powered by Bain & Company AI Platform
        </p>
      </div>
    </div>
  );
}
