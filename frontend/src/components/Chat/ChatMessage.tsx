import React from 'react';
import { ChatMessage } from '@/types';
import { format } from 'date-fns';
import { Lightbulb } from 'lucide-react';

interface ChatMessageComponentProps {
  message: ChatMessage;
  suggestions?: string[];
}

export const ChatMessageComponent: React.FC<ChatMessageComponentProps> = ({ message, suggestions }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="flex flex-col max-w-xs lg:max-w-2xl">
        <div
          className={`px-4 py-3 rounded-lg ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none ml-auto'
              : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
          }`}
        >
          <p className="break-words whitespace-pre-wrap">{message.content}</p>
          <p className={`text-xs mt-2 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
            {format(message.timestamp ? new Date(message.timestamp) : new Date(), 'HH:mm')}
          </p>
        </div>

        {/* Display suggestions only for assistant messages */}
        {!isUser && suggestions && suggestions.length > 0 && (
          <div className="mt-3 ml-0 space-y-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Lightbulb size={16} className="text-yellow-500" />
              <span className="font-semibold">Next steps:</span>
            </div>
            <div className="space-y-1 pl-6">
              {suggestions.map((suggestion, idx) => (
                <div key={idx} className="text-sm text-gray-600 flex items-start space-x-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

