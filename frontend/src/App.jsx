import { useState, useEffect } from 'react';
import { AgentHub } from './components/AgentHub';
import { ChatWindow } from './components/ChatWindow';
import { useChat } from './hooks/useChat';
import { getAgents } from './services/api';

function App() {
  const [appState, setAppState] = useState('loading'); // 'loading' | 'hub' | 'chat'
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);

  const { messages, isLoading: isChatLoading, send, clearChat } = useChat();

  // Load agents on mount
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await getAgents();
        setAgents(response.agents || []);
        setAppState('hub');
      } catch (error) {
        console.error('Failed to load agents:', error);
        setAppState('hub');
      }
    };

    loadAgents();
  }, []);

  // Handle agent selection
  const handleSelectAgent = (agent) => {
    setSelectedAgent(agent);
    clearChat(agent.name);
    setAppState('chat');
  };

  // Handle back to hub
  const handleBackToHub = () => {
    setSelectedAgent(null);
    setAppState('hub');
  };

  // Handle send with agent context
  const handleSend = (question) => {
    if (selectedAgent) {
      send(question, selectedAgent.id);
    }
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-bain-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Container */}
      <div className="w-full max-w-4xl h-[85vh] max-h-[800px]">
        <div className="h-full rounded-2xl overflow-hidden glass glow-primary">
          {appState === 'hub' ? (
            <AgentHub
              agents={agents}
              onSelectAgent={handleSelectAgent}
              isLoading={false}
            />
          ) : (
            <ChatWindow
              agent={selectedAgent}
              messages={messages}
              isLoading={isChatLoading}
              onSend={handleSend}
              onBackClick={handleBackToHub}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
