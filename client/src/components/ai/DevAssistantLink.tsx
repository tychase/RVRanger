import React from 'react';
import { BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A simple component that provides a link to the developer assistant UI.
 * This is only meant for internal developer use.
 */
export function DevAssistantLink() {
  const openAssistant = () => {
    // Open the assistant UI in a new window/tab
    window.open('/chat-ui', '_blank', 'noopener,noreferrer');
  };

  // Only show the button if we're in development mode or if explicitly enabled
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_ASSISTANT === 'true') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2 ml-2 bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-900"
        onClick={openAssistant}
        title="Developer Assistant (AI)"
      >
        <BrainCircuit size={16} />
        <span className="hidden md:inline">Dev AI</span>
      </Button>
    );
  }

  // Don't render anything in production
  return null;
}