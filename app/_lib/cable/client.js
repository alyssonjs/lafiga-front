export function openChatSocket({ baseUrl, token, channelId, channelSlug, onMessage, onOpen, onClose }) {
  const wsUrl = baseUrl.replace(/^http/, 'ws') + '/cable?token=' + encodeURIComponent(token);
  const socket = new WebSocket(wsUrl);
  socket.onopen = () => {
    try {
      const identifier = { channel: 'ChatChannel' };
      if (token) identifier.token = token;
      if (channelId) identifier.channel_id = channelId;
      if (channelSlug) identifier.channel_slug = channelSlug;
      const msg = { command: 'subscribe', identifier: JSON.stringify(identifier) };
      socket.send(JSON.stringify(msg));
    } catch {}
    onOpen && onOpen();
  };
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'ping' || data.type === 'confirm_subscription' || data.type === 'welcome') return;
      if (data.message) onMessage && onMessage(data.message);
    } catch {}
  };
  socket.onclose = () => { onClose && onClose(); };
  return socket;
}
