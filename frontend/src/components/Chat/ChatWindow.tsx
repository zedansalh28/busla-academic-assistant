import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types';
import { ChatMessageComponent } from './ChatMessage';
import { Loading } from '../Common/Loaders';
import { Sparkles, MessageCircle } from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  onExampleClick?: (question: string) => void;
}

const EXAMPLE_QUESTIONS = [
  "I'm struggling with Calculus 1 derivatives — where do I start?",
  "How do I balance labs, assignments, and exam prep at SCE?",
  "Explain KVL and KCL in circuit analysis with a simple example",
  "How should I prepare my final project SRS document?",
  "I have two exams in one week — how do I prioritize?",
  "What is the best way to learn Data Structures from scratch?",
];

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, loading, onExampleClick }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages.length && !loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
        <div className="text-center max-w-md space-y-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <MessageCircle size={32} className="text-blue-600" />
          </div>

          {/* Title and description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Busla</h2>
            <p className="text-gray-600">Your SCE engineering academic assistant. Ask about any course, exam, project, or study challenge.</p>
          </div>

          {/* Example questions */}
          <div className="space-y-3 pt-4">
            <p className="text-sm font-semibold text-gray-700 flex items-center justify-center space-x-2">
              <Sparkles size={16} className="text-yellow-500" />
              <span>Try asking:</span>
            </p>
            <div className="space-y-2">
              {EXAMPLE_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onExampleClick?.(question)}
                  className="w-full p-3 text-left text-sm bg-white border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all text-gray-700 hover:text-blue-600 font-medium"
                >
                  "{question}"
                </button>
              ))}
            </div>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-gray-500 pt-4">
            Busla does not access SCE systems or grades. It explains, guides, and helps you study.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
      {messages.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">No messages yet</p>
        </div>
      )}
      {messages.map((msg, idx) => (
        <ChatMessageComponent key={idx} message={msg} suggestions={msg.suggestions || []} />
      ))}
      {loading && (
        <div className="flex justify-start">
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 rounded-bl-none">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
};
