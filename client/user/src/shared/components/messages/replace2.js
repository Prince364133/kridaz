import fs from 'fs';

const p = 'c:/Users/saavi/OneDrive/Desktop/kridaz/kridaz/client/user/src/user/components/messages/ChatWindow.jsx';
let content = fs.readFileSync(p, 'utf8');

const regexSend = /const handleSendMessage = async \(e\) => \{[\s\S]*?catch \(err\) \{[\s\S]*?console\.error\(\"Failed to send message:\", err\);\s*\}\s*\};/;

const newHandleSendMessage = `  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit(SOCKET.STOP_TYPING, chat._id);
    setIsTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const msgToSend = message;
    setMessage('');

    const tempMessageId = "temp_" + Date.now();
    const tempMessage = {
      _id: tempMessageId,
      content: msgToSend,
      sender: { user: user },
      createdAt: new Date().toISOString(),
      chat: chat._id,
      readBy: [],
      isTemp: true
    };
    
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const data = await sendMessageMutation({
        chatId: chat._id,
        content: msgToSend
      }).unwrap();

      socket.emit(SOCKET.NEW_MESSAGE, data);
      setMessages((prev) => prev.map(m => m._id === tempMessageId ? data : m));
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages((prev) => prev.filter(m => m._id !== tempMessageId));
    }
  };`;

content = content.replace(regexSend, newHandleSendMessage);

const regexTick = /<svg className=\{`w-4 h-\[11px\] \$\{isRead \? 'text-\[\#34B7F1\]' : 'text-\[\#84CC16\]\/40'\}`\} viewBox=\"0 0 20 12\" fill=\"none\">[\s\S]*?<path d=\"M1 6l4 4L13 2\" stroke=\"currentColor\" strokeWidth=\"1.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\"\/>[\s\S]*?<path d=\"M7 6l4 4L19 2\" stroke=\"currentColor\" strokeWidth=\"1.5\" strokeLinecap=\"round\" strokeLinejoin=\"round\" opacity=\"0.6\"\/>[\s\S]*?<\/svg>/;

const newTickMark = `<svg className={\`w-4 h-[11px] \${isRead ? 'text-[#34B7F1]' : 'text-[#84CC16]/40'}\`} viewBox="0 0 20 12" fill="none">
  <path d="M1 6l4 4L13 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  {(isRead || otherOnline) && (
    <path d="M7 6l4 4L19 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
  )}
  </svg>`;

content = content.replace(regexTick, newTickMark);

fs.writeFileSync(p, content);
console.log('Done replacement');
