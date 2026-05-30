import { useState, useRef, useEffect, useCallback } from 'react';
import { Check, X, Pencil } from 'lucide-react';

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
  displayClassName?: string;
  inputClassName?: string;
  showIcon?: boolean;
  multiline?: boolean;
}

export default function InlineEdit({
  value,
  onSave,
  onCancel,
  placeholder = '点击编辑',
  className = '',
  displayClassName = '',
  inputClassName = '',
  showIcon = true,
  multiline = false,
}: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed !== value) {
      onSave(trimmed);
    }
    setEditing(false);
  }, [draft, value, onSave]);

  const handleCancel = useCallback(() => {
    setDraft(value);
    setEditing(false);
    onCancel?.();
  }, [value, onCancel]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel, multiline]);

  if (editing) {
    const InputTag = multiline ? 'textarea' : 'input';
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <InputTag
          ref={inputRef as any}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 px-2 py-1 bg-slate-800 border border-cyan-500/50 rounded text-sm text-white focus:outline-none focus:border-cyan-400 ${inputClassName}`}
          rows={multiline ? 3 : undefined}
        />
        <button
          onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
          className="p-1 text-emerald-400 hover:bg-emerald-500/15 rounded"
          title="保存"
        >
          <Check size={14} />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
          className="p-1 text-slate-400 hover:bg-slate-700/50 rounded"
          title="取消"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 cursor-pointer ${className}`}
      onClick={() => setEditing(true)}
    >
      <span className={displayClassName || 'text-sm text-slate-300 hover:text-white'}>
        {value || <span className="text-slate-500 italic">{placeholder}</span>}
      </span>
      {showIcon && (
        <Pencil size={12} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
      )}
    </div>
  );
}
