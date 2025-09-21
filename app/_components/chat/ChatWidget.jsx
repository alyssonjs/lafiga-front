"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "../../_lib/api/client";
import { openChatSocket } from "../../_lib/cable/client";
import { env } from "../../../env";
import { useAuth } from "../../_context/AuthContext";
import styles from "../../_styles/character/CharacterForm.module.css";

// Floating, minimizable chat widget with channels, DMs, auto-scroll, and commands (!d20+1 etc)
export default function ChatWidget({ sheetId = null, characterId = null, characterName = null }) {
  // UI state
  const [mounted, setMounted] = useState(false); // avoid SSR/client markup mismatch
  const [hasToken, setHasToken] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  // Drawer UI state only
  const [showChannels, setShowChannels] = useState(true);

  // Chat state
  const [channels, setChannels] = useState([]);
  const [active, setActive] = useState(null); // active channel
  const activeIdRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [allowedSlugs, setAllowedSlugs] = useState([]); // array of slugs
  const allowedSlugsRef = useRef([]);
  const roleRef = useRef(null);
  const lastIdRef = useRef(null);

  // Infra
  const wsRef = useRef(null);
  const listRef = useRef(null);
  const baseUrl = useMemo(() => env.NEXT_PUBLIC_API_BASE_URL, []);
  // Default channel is always General
  const defaultSlug = useMemo(() => 'general', []);
  const { role } = useAuth?.() || {};
  const equipModsRef = useRef(null);

  // Mark mounted and snapshot auth token on client
  useEffect(() => {
    setMounted(true);
    try {
      const t = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
      setHasToken(!!t);
    } catch (_) { setHasToken(false); }
  }, []);

  const slugify = useCallback((s) => {
    if (!s) return '';
    return String(s)
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '') // remove diacritics
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }, []);

  // Helpers
  const closeSocket = () => { try { wsRef.current && wsRef.current.close(); } catch {} wsRef.current = null; };
  const fmtDateTime = useCallback((iso) => {
    try {
      const d = new Date(iso);
      const dd = d.toLocaleDateString('pt-BR');
      const hh = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `${dd} ${hh}`;
    } catch { return ''; }
  }, []);

  const openSocket = useCallback((token, ch) => {
    if (!token || !ch) return;
    closeSocket();
    wsRef.current = openChatSocket({
      baseUrl,
      token,
      channelId: ch.id,
      channelSlug: ch.slug,
      onMessage: (msg) =>
        setMessages((prev) => {
          if (!msg || msg.channel_id !== ch.id) return prev;
          // dedupe by id
          if (prev.some((m) => m.id === msg.id)) return prev;
          try { lastIdRef.current = msg.id; } catch {}
          return [...prev, msg];
        }),
    });
  }, [baseUrl]);

  // Load equipment mods (fighting style bonuses) when sheetId changes
  useEffect(() => {
    (async () => {
      if (!sheetId) { equipModsRef.current = null; return; }
      try {
        const sum = await apiClient.get(`/api/v1/player/sheets/${sheetId}/summary`);
        const mods = sum?.summary?.equipment?.mods || null;
        equipModsRef.current = mods;
      } catch (_) {
        equipModsRef.current = null;
      }
    })();
  }, [sheetId]);

  const loadMessages = useCallback(async (ch) => {
    if (!ch) return;
    const hist = await apiClient.get(`/api/v1/player/channels/${ch.id}/messages`);
    setMessages(hist.messages || []);
    try {
      const arr = hist.messages || [];
      if (arr.length) lastIdRef.current = arr[arr.length - 1].id;
    } catch {}
  }, []);

  const loadInFlightRef = useRef(false);
  const loadChannels = useCallback(async () => {
    if (loadInFlightRef.current) return channels;
    loadInFlightRef.current = true;
    try {
      const resIdx = await apiClient.get('/api/v1/player/channels');
      const list = resIdx.channels || [];
      if (roleRef.current === 'admin') {
        setChannels(list);
        return list;
      }
      const allowed = new Set(allowedSlugsRef.current || []);
      const filtered = list.filter((c) => allowed.has(c.slug) || (activeIdRef.current && c.id === activeIdRef.current));
      setChannels(filtered);
      return filtered;
    } finally {
      loadInFlightRef.current = false;
    }
  }, []);

  const ensureDefaultChannel = useCallback(async (slug) => {
    let list = await loadChannels();
    let ch = list.find((c) => c.slug === slug);
    if (!ch) {
      const created = await apiClient.post('/api/v1/player/channels', { channel: { name: slug, slug } });
      ch = created.channel || created;
      setChannels((prev) => (prev.some((x) => x.id === ch.id) ? prev : [...prev, ch]));
    }
    return ch;
  }, [loadChannels]);

  useEffect(() => { roleRef.current = role; }, [role]);

  // Init and react to default slug or login changes
  useEffect(() => {
    (async () => {
      if (!mounted || !hasToken) return; // not ready or not logged in
      const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
      try {
        // Compute allowed slugs based on current character (if provided)
        let groupSlug = null;
        if (characterId && role !== 'admin') {
          try {
            const chRes = await apiClient.get(`/api/v1/player/characters/${characterId}`);
            const gid = chRes?.character?.group_id;
            if (gid) groupSlug = `group-${gid}`;
          } catch (_) { /* ignore */ }
        }
        const next = ['general'];
        const charSlug = characterName ? `char-${slugify(characterName)}` : null;
        if (charSlug) next.push(charSlug);
        if (groupSlug) next.push(groupSlug);
        const keyOld = (allowedSlugsRef.current || []).join(',');
        const keyNew = next.join(',');
        if (keyOld !== keyNew) {
          allowedSlugsRef.current = next;
          setAllowedSlugs(next);
        }

        // Ensure character channel exists (private), if we have a name
        if (charSlug) {
          try {
            const created = await apiClient.post('/api/v1/player/channels', { channel: { name: characterName, slug: charSlug, kind: 'private_channel' } });
            const newCh = created.channel || created;
            setChannels((prev) => (prev.some((x)=>x.id===newCh.id) ? prev : [...prev, newCh]));
          } catch (_) { /* idempotent on backend */ }
        }

        const ch = await ensureDefaultChannel(defaultSlug);
        setActive(ch);
        activeIdRef.current = ch?.id || null;
        await loadMessages(ch);
        openSocket(token, ch);
      } catch (e) {
        console.warn('Chat init failed', e);
      }
    })();
    return () => closeSocket();
  }, [mounted, hasToken, defaultSlug, ensureDefaultChannel, loadMessages, openSocket, characterId, sheetId, characterName, slugify]);

  // Auto-scroll when messages grow
  useEffect(() => {
    if (!isOpen || minimized) return;
    try {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }, [messages.length, isOpen, minimized, active?.id]);

  const selectChannel = useCallback(async (ch) => {
    if (!ch) return;
    setActive(ch);
    activeIdRef.current = ch?.id || null;
    await loadMessages(ch);
    const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
    openSocket(token, ch);
  }, [loadMessages, openSocket]);

  const openDirect = useCallback(async (userId) => {
    const uid = parseInt(userId, 10);
    if (!uid) return;
    try {
      const res = await apiClient.post('/api/v1/player/channels/direct', { user_id: uid });
      const ch = res.channel || res;
      await loadChannels();
      await selectChannel(ch);
      setIsOpen(true);
      setMinimized(false);
    } catch (e) {
      console.warn('Open DM failed', e);
    }
  }, [loadChannels, selectChannel]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    try {
      await apiClient.post(`/api/v1/player/channels/${active.id}/messages`, { message: { content: text } });
      setText("");
      // message will arrive via WS and be appended with dedupe
    } catch (e) { console.warn('Send failed', e); }
  };

  // External roll events (e.g., clicking on proficiency/saving throw)
  useEffect(() => {
    const handler = async (ev) => {
      try {
        if (!active) return;
        const d = (ev && ev.detail) || {};
        // Optional label message
        if (d.text) {
          await apiClient.post(`/api/v1/player/channels/${active.id}/messages`, { message: { content: d.text } });
        }
        // Send the command so backend rolls and broadcasts result
        if (typeof d.modifier === 'number') {
          let m = Number(d.modifier) || 0;
          // Optional: apply fighting style weapon mods if context provided
          try {
            if (d.apply_fighting_style) {
              const mods = equipModsRef.current;
              const side = (d.weapon_side === 'off' ? 'off_hand' : 'main_hand');
              const kind = (d.kind === 'damage' ? 'damage' : 'attack');
              const wm = (mods && mods.weapon_mods && mods.weapon_mods[side]) || null;
              if (wm) {
                if (kind === 'attack' && Number(wm.attack)) m += Number(wm.attack);
                if (kind === 'damage' && Number(wm.damage)) m += Number(wm.damage);
                // offhand_add_ability handled on the player side; here we only add fixed style bonus
              }
            }
          } catch (_) {}
          const sign = m >= 0 ? '+' : '';
          await apiClient.post(`/api/v1/player/channels/${active.id}/messages`, { message: { content: `!d20${sign}${m}` } });
        } else if (typeof d.command === 'string' && d.command.trim().startsWith('!')) {
          let cmd = d.command.trim();
          try {
            if (d.apply_fighting_style && d.kind === 'damage') {
              // pattern: !dX[+/-N]
              const re = /^!d(\d+)([+-]\d+)?$/i;
              const m = cmd.match(re);
              if (m) {
                const baseDie = m[1];
                const tail = m[2] ? parseInt(m[2], 10) : 0;
                const mods = equipModsRef.current;
                const side = (d.weapon_side === 'off' ? 'off_hand' : 'main_hand');
                const wm = (mods && mods.weapon_mods && mods.weapon_mods[side]) || {};
                const bonus = Number(wm.damage || 0);
                const total = tail + bonus;
                const sign = total >= 0 ? '+' : '';
                cmd = `!d${baseDie}${total ? `${sign}${total}` : ''}`;
              }
            }
          } catch (_) {}
          await apiClient.post(`/api/v1/player/channels/${active.id}/messages`, { message: { content: cmd } });
        }
      } catch (e) {
        console.warn('Chat external roll failed', e);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('chat:roll', handler);
      return () => window.removeEventListener('chat:roll', handler);
    }
  }, [active]);

  // Refresh channel list when allowed slugs change (for non-admin)
  useEffect(() => {
    if (role !== 'admin') {
      (async () => { try { await loadChannels(); } catch {} })();
    }
  }, [allowedSlugs, role, loadChannels]);

  // Polling fallback: fetch new messages periodically (in case WS drops)
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(async () => {
      try {
        const afterId = lastIdRef.current;
        const url = afterId
          ? `/api/v1/player/channels/${active.id}/messages?after_id=${afterId}`
          : `/api/v1/player/channels/${active.id}/messages`;
        const res = await apiClient.get(url);
        const incoming = res.messages || [];
        if (incoming.length) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id));
            const merged = [...prev, ...incoming.filter((m) => !existing.has(m.id))];
            try { lastIdRef.current = merged[merged.length - 1].id; } catch {}
            return merged;
          });
        }
      } catch {}
    }, 4000);
    return () => clearInterval(timer);
  }, [active]);

  // Floating/minimizable container
  const containerStyle = {
    position: 'fixed',
    bottom: 16,
    right: 16,
    width: 340,
    maxHeight: '70vh',
    zIndex: 1000,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
  };

  const headerStyle = {
    background: 'var(--primary, #1f2937)',
    color: '#fff',
    padding: '8px 12px',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  };

  const bodyStyle = {
    background: 'var(--light, #f5f5f5)',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
  };
  const mainColStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  };
  const chanColStyle = {
    width: 180,
    maxWidth: '45%',
    borderLeft: '1px solid rgba(0,0,0,0.08)',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  };

  const pillStyle = {
    position: 'fixed',
    bottom: 16,
    right: 16,
    background: 'var(--primary, #1f2937)',
    color: '#fff',
    padding: '10px 14px',
    borderRadius: 999,
    boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
    cursor: 'pointer',
    zIndex: 1000
  };

  // Channel list accordion (bottom-left)
  // Drawer overlay and panel styles
  const overlayStyle = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 999
  };
  const drawerStyle = (open) => ({
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: 380,
    maxWidth: '90vw',
    background: 'var(--light, #f5f5f5)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    zIndex: 1000,
    transform: `translateX(${open ? '0' : '100%'})`,
    transition: 'transform 0.25s ease-in-out',
    display: 'flex',
    flexDirection: 'column'
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!mounted || !hasToken) return null; // Evita hidratação incorreta e não renderiza para anônimos

  if (!isOpen) {
    return (
      <div style={pillStyle} onClick={() => { setIsOpen(true); setMinimized(false); }}>
        Abrir Chat
      </div>
    );
  }

  return (
    <>
    {/* Drawer (no overlay; page behind remains clickable) */}
    <div style={drawerStyle(true)}>
      <div style={headerStyle} onClick={() => setMinimized((v) => !v)}>
        <div style={{ fontWeight: 600 }}>Chat {active ? `- ${active.name}` : ''}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowChannels((v) => !v); }}
            title={showChannels ? 'Ocultar canais' : 'Mostrar canais'}
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.5)', color: '#fff', cursor: 'pointer', borderRadius: 6, padding: '2px 6px', fontSize: 12 }}
          >{showChannels ? 'Canais ▾' : 'Canais ▸'}</button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setMinimized((v) => !v); }}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >{minimized ? '▴' : '▾'}</button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >✕</button>
        </div>
      </div>

      {!minimized && (
        <div style={bodyStyle}>
          {/* Main column */}
          <div style={mainColStyle}>
            {/* DM open */}
            <DMOpener onOpen={openDirect} />

            {/* Messages */}
            <div ref={listRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 8, background: 'var(--dark)', margin: 8, borderRadius: 8 }}>
              {(messages || []).map((m) => (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary, #f5f5f5)' }}>{m.author_name || '—'}</span>
                    <span style={{ opacity: 0.8, fontSize: 12 }}>{fmtDateTime(m.created_at)}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', color: m.kind === 'system' ? 'var(--highlight)' : 'var(--default)', fontWeight: m.kind === 'system' ? 600 : 500 }}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={send} style={{ display:'flex', gap: 8, padding: 8, paddingTop: 0 }}>
              <input className={styles.inputText} value={text} onChange={(e)=>setText(e.target.value)} placeholder="Digite uma mensagem ou !d20+1" />
              <button className={styles.submitButton} type="submit" disabled={!active || !text.trim()}>Enviar</button>
            </form>
          </div>

          {/* Channels sidebar (right side) */}
          {showChannels ? (
            <div style={chanColStyle}>
              <div style={{ padding: '8px 10px', fontWeight: 600, background: 'rgba(0,0,0,0.04)', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Canais</span>
                <button
                  type="button"
                  onClick={() => setShowChannels(false)}
                  title="Minimizar canais"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 14 }}
                >⟨</button>
              </div>
              <div style={{ overflowY: 'auto', padding: 8 }}>
                {(channels || []).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectChannel(c)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: '1px solid rgba(0,0,0,0.1)',
                      background: active?.id === c.id ? 'var(--highlight, #e5e7eb)' : '#fff',
                      borderRadius: 6,
                      padding: '6px 8px',
                      cursor: 'pointer',
                      fontSize: 12,
                      marginBottom: 6
                    }}
                  >{c.name}</button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowChannels(true)}
                title="Mostrar canais"
                style={{ height: '100%', border: 'none', background: '#fff', borderLeft: '1px solid rgba(0,0,0,0.08)', cursor: 'pointer', padding: '0 6px' }}
              >⟩</button>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}

function DMOpener({ onOpen }) {
  const [uid, setUid] = useState('');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onOpen && onOpen(uid); setUid(''); }} style={{ display: 'flex', gap: 6, padding: '0 8px' }}>
      <input
        value={uid}
        onChange={(e) => setUid(e.target.value)}
        placeholder="Abrir DM com usuário (ID)"
        style={{ flex: 1, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 6, padding: '6px 8px' }}
      />
      <button type="submit" className={styles.submitButton} disabled={!uid}>DM</button>
    </form>
  );
}
