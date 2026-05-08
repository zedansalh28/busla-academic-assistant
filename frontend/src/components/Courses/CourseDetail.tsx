import React, { useState } from 'react';
import { Course, CourseMaterial, ChatMessage } from '@/types';
import { ArrowLeft, Plus, Trash2, FileText, Send, Bot, User, Trash } from 'lucide-react';
import { UploadMaterialModal } from './UploadMaterialModal';

interface CourseDetailProps {
  course: Course;
  materials: CourseMaterial[];
  messages: ChatMessage[];
  chatLoading: boolean;
  materialsLoading: boolean;
  onBack: () => void;
  onAddText: (title: string, content: string) => Promise<unknown>;
  onUploadFile: (title: string, file: File) => Promise<unknown>;
  onDeleteMaterial: (materialId: string) => Promise<void>;
  onSendMessage: (content: string) => Promise<void>;
  onClearChat: () => void;
}

const EXAMPLE_QUESTIONS = [
  'Explain the main topics in simple words',
  'What are the key concepts I should focus on?',
  'Give me practice questions for the exam',
  'Summarize the uploaded material',
  'Create a study plan for this course',
  'What are the most important formulas?',
];

export const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  materials,
  messages,
  chatLoading,
  materialsLoading,
  onBack,
  onAddText,
  onUploadFile,
  onDeleteMaterial,
  onSendMessage,
  onClearChat,
}) => {
  const [showUpload, setShowUpload] = useState(false);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'materials'>('chat');

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || chatLoading) return;
    setInput('');
    await onSendMessage(msg);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-primary hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Courses</span>
        </button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-secondary">{course.name}</h2>
          {course.code && <p className="text-sm text-gray-400 font-mono">{course.code}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'chat' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Ask Busla
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'materials' ? 'bg-white shadow text-primary' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Materials ({materials.length})
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col" style={{ height: '62vh' }}>
          {/* Chat header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-white flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">Busla — Course Assistant</p>
              <p className="text-xs text-blue-100">
                {materials.length > 0
                  ? `Using ${materials.length} uploaded material${materials.length > 1 ? 's' : ''}`
                  : 'No materials uploaded — general knowledge mode'}
              </p>
            </div>
            {messages.length > 0 && (
              <button
                onClick={onClearChat}
                title="Clear chat"
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
              >
                <Trash size={16} />
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="py-4">
                <p className="text-sm text-gray-500 mb-3 text-center">
                  Ask Busla anything about <strong>{course.name}</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {EXAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => onSendMessage(q)}
                      className="text-left text-xs px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-100"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-primary' : 'bg-indigo-600'}`}>
                    {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-tl-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-3 flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask about ${course.name}...`}
              rows={1}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm"
            />
            <button
              onClick={handleSend}
              disabled={chatLoading || !input.trim()}
              className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {materials.length === 0
                ? 'No materials yet. Add a file or paste text below.'
                : `${materials.length} material${materials.length > 1 ? 's' : ''} uploaded`}
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="btn-primary flex items-center space-x-2 text-sm"
            >
              <Plus size={16} />
              <span>Add Material</span>
            </button>
          </div>

          {materials.length === 0 && (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center text-gray-400">
              <FileText size={40} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium">No materials uploaded yet</p>
              <p className="text-sm mt-1">Upload a PDF, TXT, DOCX file or paste text.</p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 btn-primary text-sm"
              >
                Add Material
              </button>
            </div>
          )}

          <div className="space-y-2">
            {materials.map((material) => (
              <div
                key={material.id}
                className="bg-white border border-gray-100 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{material.title}</p>
                    <p className="text-xs text-gray-400">
                      {material.material_type.toUpperCase()}
                      {material.file_size > 0 ? ` · ${formatBytes(material.file_size)}` : ''}
                      {' · '}{material.content.length.toLocaleString()} chars
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete "${material.title}"?`)) onDeleteMaterial(material.id);
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete material"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <UploadMaterialModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onAddText={onAddText}
        onUploadFile={onUploadFile}
        loading={materialsLoading}
      />
    </div>
  );
};
