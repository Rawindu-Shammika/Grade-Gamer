import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Search, Send, MessageSquare, AlertCircle, RefreshCw, User } from 'lucide-react';

export const Messages = ({ currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentChats, setRecentChats] = useState([]);
  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const messageEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load recent conversations
  const fetchRecentChats = async () => {
    if (!currentUser?.id) return;
    try {
      // Get all messages where user is sender or receiver
      const { data, error } = await supabase
        .from('direct_messages')
        .select('sender_id, receiver_id')
        .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

      if (error) throw error;

      // Extract unique user IDs
      const uniqueUserIds = new Set();
      data?.forEach((msg) => {
        if (msg.sender_id !== currentUser.id) uniqueUserIds.add(msg.sender_id);
        if (msg.receiver_id !== currentUser.id) uniqueUserIds.add(msg.receiver_id);
      });

      if (uniqueUserIds.size === 0) {
        setRecentChats([]);
        return;
      }

      // Fetch profiles of these users
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, in_game_name, unique_account_id, platform_id')
        .in('id', Array.from(uniqueUserIds));

      if (profError) throw profError;
      setRecentChats(profiles || []);
    } catch (err) {
      console.error('Error fetching recent chats:', err);
    }
  };

  useEffect(() => {
    fetchRecentChats();
  }, [currentUser?.id]);

  // Search profile by unique_account_id
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, in_game_name, unique_account_id, platform_id')
          .ilike('unique_account_id', `%${searchQuery.trim()}%`)
          .limit(5);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Error searching profiles:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Load message history between active user and current user
  const fetchMessages = async () => {
    if (!currentUser?.id || !activeChatUser?.id) return;
    setIsLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChatUser.id}),and(sender_id.eq.${activeChatUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error loading messages:', err);
      setErrorMessage('Failed to retrieve message logs.');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time changes
    if (!currentUser?.id || !activeChatUser?.id) return;
    const channel = supabase
      .channel('direct_messages_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        const newMsg = payload.new;
        if (
          (newMsg.sender_id === currentUser.id && newMsg.receiver_id === activeChatUser.id) ||
          (newMsg.sender_id === activeChatUser.id && newMsg.receiver_id === currentUser.id)
        ) {
          setMessages((prev) => [...prev, newMsg]);
        }
        fetchRecentChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, activeChatUser?.id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChatUser || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: activeChatUser.id,
          message: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
      fetchMessages();
      fetchRecentChats();
    } catch (err) {
      console.error('Failed to send message:', err);
      setErrorMessage(err.message || 'Transmission failed.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectChat = (userProfile) => {
    setActiveChatUser(userProfile);
    setSearchQuery('');
    setSearchResults([]);
    setErrorMessage(null);
  };

  return (
    <div className="bg-[#0b0f19] min-h-screen text-slate-200 p-8 font-sans space-y-6 pt-28 pb-16 w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-16 flex flex-col md:flex-row gap-8">
      {/* Left Panel: Search & Chat List */}
      <div className="w-full md:w-80 flex flex-col gap-4 flex-shrink-0">
        <div className="bg-[#121620] border border-slate-800 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#00b4d8] font-mono">
              Comms Channels
            </h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase">Direct Message Matrix</p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by GradeGamer ID (e.g. GG-784912)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-cyan-500 transition-all font-mono"
            />
            {isSearching && (
              <div className="absolute right-3 top-3 text-[10px] text-slate-500 animate-pulse">...</div>
            )}
          </div>

          {/* Search Dropdown list */}
          {searchResults.length > 0 && (
            <div className="bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-2xl space-y-1">
              <div className="p-2 border-b border-slate-900 text-[9px] text-[#00b4d8] font-mono uppercase">
                Registry Matches
              </div>
              {searchResults.map((userProfile) => (
                <div
                  key={userProfile.id}
                  onClick={() => handleSelectChat(userProfile)}
                  className="flex items-center justify-between px-3 py-2 hover:bg-slate-900 cursor-pointer text-xs transition-all"
                >
                  <div>
                    <span className="font-bold text-white block">{userProfile.in_game_name || userProfile.platform_id}</span>
                    <span className="text-[10px] text-slate-500 font-mono">GradeGamer ID: {userProfile.unique_account_id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Conversations */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block">
              Recent Dialogues
            </span>

            {recentChats.length === 0 ? (
              <div className="text-center py-8 text-[11px] text-slate-500 uppercase tracking-wide border border-dashed border-slate-850 rounded-xl">
                No active conversations
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {recentChats.map((chat) => {
                  const isSelected = activeChatUser?.id === chat.id;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-950/10 shadow-lg'
                          : 'border-slate-850 bg-slate-950/30 hover:bg-slate-900/60'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs uppercase flex-shrink-0 ${
                        isSelected ? 'bg-[#00b4d8] border-cyan-400 text-slate-950' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {chat.in_game_name ? chat.in_game_name.slice(0, 2) : 'GG'}
                      </div>
                      <div className="overflow-hidden">
                        <span className="font-bold text-white block text-xs truncate">
                          {chat.in_game_name || chat.platform_id}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">GradeGamer ID: {chat.unique_account_id}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Chat Room Container */}
      <div className="flex-grow flex flex-col bg-[#121620] border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[60vh] md:min-h-[70vh]">
        {activeChatUser ? (
          <>
            {/* Chat Workspace Header */}
            <div className="flex items-center justify-between border-b border-slate-850 p-5 bg-[#121620]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00b4d8] to-cyan-400 flex items-center justify-center font-black text-slate-950 text-xs">
                  {activeChatUser.in_game_name ? activeChatUser.in_game_name.slice(0, 2).toUpperCase() : 'GG'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wide">
                    {activeChatUser.in_game_name || activeChatUser.platform_id}
                  </h4>
                  <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block">
                    GradeGamer ID: {activeChatUser.unique_account_id}
                  </span>
                </div>
              </div>
              <button
                onClick={fetchMessages}
                className="p-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 rounded-lg cursor-pointer text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 p-3 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Message History Space */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 max-h-[50vh]">
              {isLoadingMessages && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#00b4d8] mb-2" />
                  <span className="text-[10px] font-mono uppercase text-slate-500">Retrieving chat records...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
                  <MessageSquare className="w-8 h-8 text-slate-650 mb-2" />
                  <p className="text-xs uppercase tracking-wide font-mono">No communication records found.</p>
                  <p className="text-[10px] text-slate-600">Send an initial message to open channel node connection.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === currentUser.id;
                  const time = msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col max-w-[70%] ${isOwn ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isOwn
                          ? 'bg-[#00b4d8] text-slate-950 rounded-tr-none font-medium'
                          : 'bg-slate-950 text-slate-200 rounded-tl-none border border-slate-850'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[8px] font-mono text-slate-500 mt-1 uppercase tracking-widest">{time}</span>
                    </div>
                  );
                })
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Message Sender Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-[#121620] border-t border-slate-850 flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Synchronize command transmission text..."
                className="flex-grow bg-slate-950 border border-slate-850 rounded-xl px-4 py-3 text-xs text-slate-350 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all font-sans"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="p-3 bg-[#00b4d8] hover:bg-[#0096c7] disabled:bg-slate-850 disabled:text-slate-600 text-slate-950 rounded-xl transition-all cursor-pointer border-none flex items-center justify-center flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-center text-cyan-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase text-white tracking-wide">
                Direct Dialogue Matrix Offline
              </h4>
              <p className="text-xs text-slate-650 max-w-sm leading-relaxed">
                Select a contact from your recent communications list on the left, or search by a player's 6-digit GradeGamer ID.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
