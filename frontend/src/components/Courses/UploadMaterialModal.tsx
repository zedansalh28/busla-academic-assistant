import React, { useState, useRef } from 'react';
import { Modal } from '../Common/Modal';
import { Upload, FileText } from 'lucide-react';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddText: (title: string, content: string) => Promise<unknown>;
  onUploadFile: (title: string, file: File) => Promise<unknown>;
  loading?: boolean;
}

export const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({
  isOpen,
  onClose,
  onAddText,
  onUploadFile,
  loading = false,
}) => {
  const [tab, setTab] = useState<'text' | 'file'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle('');
    setContent('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'text') {
      if (!content.trim()) return;
      await onAddText(title.trim() || 'Untitled Material', content.trim());
    } else {
      if (!file) return;
      await onUploadFile(title.trim() || file.name.replace(/\.[^.]+$/, ''), file);
    }
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Add Course Material" onClose={onClose}>
      <div className="space-y-4">
        {/* Tab switcher */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'text' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Paste Text
          </button>
          <button
            type="button"
            onClick={() => setTab('file')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === 'file' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Upload File
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tab === 'file' ? 'Leave empty to use filename' : 'e.g., Lecture 3 Summary'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {tab === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material Content *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste lecture notes, syllabus, exercise instructions, or any course text here..."
                rows={8}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">{content.length} characters</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
              >
                {file ? (
                  <div className="flex items-center justify-center space-x-2 text-primary">
                    <FileText size={20} />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    <Upload size={28} className="mx-auto mb-2" />
                    <p className="text-sm">Click to select a file</p>
                    <p className="text-xs mt-1">Supported: PDF, TXT, DOCX (max 10 MB)</p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.txt,.docx"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (tab === 'text' ? !content.trim() : !file)}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Add Material'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
