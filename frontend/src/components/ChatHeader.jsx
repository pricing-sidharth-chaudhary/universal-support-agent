import { ArrowLeft, Database, DollarSign, Plug } from 'lucide-react';

// Icon mapping
const iconMap = {
  DollarSign: DollarSign,
  Database: Database,
  Plug: Plug,
};

export function ChatHeader({ agent, onBackClick }) {
  const IconComponent = iconMap[agent?.icon] || Database;

  return (
    <header className="bg-white px-6 py-4 flex items-center justify-between border-b border-gray-200">
      <div className="flex items-center gap-3">
        {/* Back Button */}
        <button
          onClick={onBackClick}
          className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Agent Info */}
        <div className="w-10 h-10 rounded-xl bg-bain-red/10 flex items-center justify-center text-bain-red">
          <IconComponent className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display font-semibold text-gray-900">
            {agent?.name || 'AI Agent'}
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Database className="w-3 h-3" />
            <span>{agent?.tickets_count || 0} tickets indexed</span>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-gray-500">Online</span>
      </div>
    </header>
  );
}
