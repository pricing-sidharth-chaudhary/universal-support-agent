import { useState, useCallback } from 'react';
import { sendMessage } from '../services/api';

// Tool action simulation responses
const TOOL_SIMULATIONS = {
  // Pricing Agent Tools
  updateOpportunityName: {
    processingMessage: "Updating opportunity name...",
    successMessage: "✓ Opportunity name has been successfully updated in Cortex.",
    duration: 2000
  },
  updateClientName: {
    processingMessage: "Updating client name...",
    successMessage: "✓ Client name has been successfully updated in the system.",
    duration: 2000
  },
  updateIndustry: {
    processingMessage: "Updating industry field...",
    successMessage: "✓ Industry has been successfully updated for this opportunity.",
    duration: 1500
  },
  updateCapability: {
    processingMessage: "Updating capability...",
    successMessage: "✓ Capability has been successfully updated for this opportunity.",
    duration: 1500
  },
  updateResourceRates: {
    processingMessage: "Fetching latest rates from master data...",
    successMessage: "✓ Resource rates have been refreshed and updated successfully.",
    duration: 2500
  },
  
  // Cortex Agent Tools
  startSalesforceMigration: {
    processingMessage: "Initializing Salesforce migration wizard...",
    successMessage: "✓ Migration wizard launched. Please follow the on-screen steps to complete the data migration.",
    duration: 2500
  },
  openFieldManager: {
    processingMessage: "Opening Field Manager...",
    successMessage: "✓ Field Manager is now open. You can create and configure custom fields.",
    duration: 1500
  },
  openRoleManager: {
    processingMessage: "Loading Role Manager...",
    successMessage: "✓ Role Manager is now open. You can configure user roles and permissions.",
    duration: 1500
  },
  createReport: {
    processingMessage: "Creating new report...",
    successMessage: "✓ Report builder is now open. Select your data source and fields to build your report.",
    duration: 2000
  },
  createDashboard: {
    processingMessage: "Creating new dashboard...",
    successMessage: "✓ Dashboard builder is now open. Add components and link them to your reports.",
    duration: 2000
  },
  createEmailTemplate: {
    processingMessage: "Opening email template editor...",
    successMessage: "✓ Email template editor is now open. Design your template using the drag-and-drop builder.",
    duration: 1500
  },
  createWorkflow: {
    processingMessage: "Initializing workflow builder...",
    successMessage: "✓ Workflow builder is now open. Define your triggers, conditions, and actions.",
    duration: 2000
  },
  forceCortexResync: {
    processingMessage: "Forcing data resync...",
    successMessage: "✓ Resync initiated successfully. Data synchronization will complete within 5-10 minutes.",
    duration: 3000
  },
  addCortexUser: {
    processingMessage: "Creating new user account...",
    successMessage: "✓ User account created successfully. Welcome email has been sent to the user.",
    duration: 2500
  },
  resetCortexPassword: {
    processingMessage: "Resetting user password...",
    successMessage: "✓ Password reset email has been sent to the user. The link will expire in 24 hours.",
    duration: 2000
  },
  exportCortexData: {
    processingMessage: "Preparing data export...",
    successMessage: "✓ Export started. You will receive an email with the download link within 15 minutes.",
    duration: 2500
  },
  runDuplicateCheck: {
    processingMessage: "Scanning for duplicate records...",
    successMessage: "✓ Duplicate scan complete. Found 12 potential duplicates. Review them in the merge queue.",
    duration: 3500
  },
  refreshCortexSession: {
    processingMessage: "Clearing cache and refreshing session...",
    successMessage: "✓ Session refreshed successfully. Cortex should now load faster.",
    duration: 2000
  },
  deactivateCortexUser: {
    processingMessage: "Deactivating user account...",
    successMessage: "✓ User account has been deactivated. They can no longer log in to Cortex.",
    duration: 2000
  },
  
  // Universal Agent Tools
  redirectToPricingAgent: {
    processingMessage: "Connecting you to the Pricing Agent...",
    successMessage: "✓ You can now ask the Pricing Agent for help. Use the back button to select the Pricing Agent from the hub.",
    duration: 1500
  },
  redirectToCortexAgent: {
    processingMessage: "Connecting you to the Cortex Agent...",
    successMessage: "✓ You can now ask the Cortex Agent for help. Use the back button to select the Cortex Agent from the hub.",
    duration: 1500
  },
  redirectToIntegrationsAgent: {
    processingMessage: "Connecting you to the Integrations Agent...",
    successMessage: "✓ You can now ask the Integrations Agent for help. Use the back button to select the Integrations Agent from the hub.",
    duration: 1500
  },
  resetBainPassword: {
    processingMessage: "Opening password reset portal...",
    successMessage: "✓ Password reset portal opened. Please follow the on-screen instructions to reset your password.",
    duration: 2000
  },
  contactITHelpDesk: {
    processingMessage: "Initiating contact with IT Help Desk...",
    successMessage: "✓ IT Help Desk contact initiated. You can also reach them at it-helpdesk@bain.com or call +1-800-BAIN-HELP.",
    duration: 2000
  },
  openServiceNow: {
    processingMessage: "Opening ServiceNow portal...",
    successMessage: "✓ ServiceNow portal is now open. You can view your tickets or create new requests.",
    duration: 1500
  },
  requestApplicationAccess: {
    processingMessage: "Opening access request form...",
    successMessage: "✓ Access request form opened. Fill in the required details and submit for manager approval.",
    duration: 2000
  },
  
  // ServiceNow
  createServiceNowTicket: {
    processingMessage: "Creating ServiceNow ticket...",
    successMessage: "✓ ServiceNow ticket #INC0012345 has been created. Our support team will review your request and get back to you within 24 hours.",
    duration: 3000
  }
};

// Default simulation for unknown tools
const DEFAULT_SIMULATION = {
  processingMessage: "Processing your request...",
  successMessage: "✓ Action completed successfully.",
  duration: 2000
};

/**
 * Custom hook for managing agent-aware chat state with tool action simulation
 */
export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const addMessage = useCallback((message) => {
    const newMessage = { ...message, id: message.id || Date.now().toString() };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  }, []);

  const updateMessage = useCallback((messageId, updates) => {
    setMessages((prev) => 
      prev.map((msg) => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  const send = useCallback(async (question, agentId) => {
    if (!question.trim() || !agentId) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    addMessage(userMessage);

    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage(question, agentId);

      // Add assistant response with action links
      const assistantMessage = {
        type: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        requiresHuman: response.requires_human,
        sources: response.sources,
        confidence: response.confidence,
        actionLinks: response.action_links || [],
        actionsExecuted: false,
      };
      addMessage(assistantMessage);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to get response. Please try again.';
      setError(errorMessage);
      
      // Add error message to chat
      addMessage({
        type: 'assistant',
        content: `Sorry, I encountered an error: ${errorMessage}`,
        timestamp: new Date(),
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [addMessage]);

  const executeToolAction = useCallback(async (link, messageId) => {
    const simulation = TOOL_SIMULATIONS[link.tool_call] || DEFAULT_SIMULATION;
    
    // Mark the original message's actions as executed
    updateMessage(messageId, { actionsExecuted: true });

    // Create a unique ID for the processing message
    const processingMsgId = `tool-${Date.now()}`;
    
    // Add processing message with explicit ID
    setMessages((prev) => [...prev, {
      id: processingMsgId,
      type: 'assistant',
      content: simulation.processingMessage,
      timestamp: new Date(),
      isProcessing: true,
    }]);

    setIsLoading(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, simulation.duration));

    // Update processing message to success message
    setMessages((prev) => 
      prev.map((msg) => 
        msg.id === processingMsgId 
          ? { 
              ...msg, 
              content: simulation.successMessage,
              isProcessing: false,
              isToolResult: true,
            } 
          : msg
      )
    );

    setIsLoading(false);
  }, [updateMessage]);

  const clearChat = useCallback((agentName = 'AI assistant') => {
    setMessages([
      {
        id: 'welcome',
        type: 'assistant',
        content: `Hello! I'm your ${agentName}. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    send,
    clearChat,
    executeToolAction,
  };
}
