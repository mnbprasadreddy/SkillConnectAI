import React, { memo } from 'react';
import { Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * ChatMessage
 * Renders a single message in the AI Coach popup.
 * Memoized for performance.
 */
const ChatMessage = memo(({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center border ${
        isUser
          ? 'bg-primary/20 border-primary/30 text-primary'
          : 'bg-secondary/20 border-secondary/30 text-secondary'
      }`}>
        {isUser
          ? <User className="w-3.5 h-3.5" />
          : <Bot  className="w-3.5 h-3.5" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary/15 border border-primary/20 text-white rounded-tr-sm'
            : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
        }`}>
          {/* Render bold markdown (**text**) simply */}
          <MessageContent content={message.content} />
        </div>
        <span className="text-[9px] text-muted/50 px-1">{message.time}</span>
      </div>
    </motion.div>
  );
});

// ─── Simple bold/bullet markdown renderer ─────────────────────────
// No heavy libraries — just splits on **bold** and renders inline.

const MessageContent = memo(({ content }) => {
  if (!content) return null;

  // Split into lines for bullet rendering
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        // Render **bold** inline
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i} className="block">
            {parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{part}</span>;
            })}
            {i < lines.length - 1 && line === '' && <br />}
          </span>
        );
      })}
    </>
  );
});

ChatMessage.displayName    = 'ChatMessage';
MessageContent.displayName = 'MessageContent';
export default ChatMessage;
