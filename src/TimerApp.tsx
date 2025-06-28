import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Play, Pause, RotateCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export default function TimerApp() {
  const [timerState, setTimerState] = useState({
    todo_title: 'Loading...',
    original_seconds: 0,
    remaining_seconds: 0,
    is_active: false,
    is_paused: false,
  });

  const formatTime = (seconds: any) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timerState.is_paused) return 'text-yellow-400';
    if (timerState.remaining_seconds <= 60) return 'text-red-400';
    if (timerState.remaining_seconds <= 300) return 'text-orange-400';
    return 'text-green-400';
  };

  const loadTimerState = async () => {
    try {
      const state = await invoke('get_timer_state');
      setTimerState(state);
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
  };

  const pauseTimer = async () => {
    try {
      await invoke('pause_timer');
      setTimerState(prev => ({ ...prev, is_paused: true, is_active: false }));
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const resumeTimer = async () => {
    try {
      await invoke('resume_timer');
      setTimerState(prev => ({ ...prev, is_paused: false, is_active: true }));
    } catch (error) {
      console.error('Failed to resume timer:', error);
    }
  };

  const restartTimer = async () => {
    try {
      await invoke('restart_timer');
      await loadTimerState();
    } catch (error) {
      console.error('Failed to restart timer:', error);
    }
  };

  const closeTimer = async () => {
    try {
      await invoke('close_timer_window');
    } catch (error) {
      console.error('Failed to close timer:', error);
    }
  };

  const handleMouseDown = async (e) => {
    if (e.button === 0) {
      try {
        await invoke('start_window_drag');
      } catch (error) {
        console.error('Failed to start drag:', error);
      }
    }
  };

  useEffect(() => {
    loadTimerState();

    const unlistenUpdate = listen('timer-update', (event) => {
      setTimerState(event.payload);
    });

    const unlistenFinished = listen('timer-finished', () => {
      console.log('Timer finished!');
    });

    return () => {
      unlistenUpdate.then(fn => fn());
      unlistenFinished.then(fn => fn());
    };
  }, []);

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
      <div 
        className="relative bg-black/40 backdrop-blur-xl shadow-2xl select-none cursor-grab active:cursor-grabbing" 
        style={{ width: '180px', height: '100px' }}
        onMouseDown={handleMouseDown}
      >
        {/* Corner borders */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/40"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/40"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/40"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/40"></div>
        </div>
        
        {/* Timer display - absolutely centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-2xl font-mono font-bold ${getTimeColor()} drop-shadow-lg leading-none`}>
            {formatTime(timerState.remaining_seconds)}
          </div>
        </div>
        
        {/* Title - top left */}
        <div className="absolute top-2 left-3 text-xs text-white/80 truncate max-w-16">
          {timerState.todo_title}
        </div>
        
        {/* Actions - top right */}
        <div className="absolute top-1.5 right-2 flex gap-1">
          {/* Pause/Resume button */}
          {timerState.is_paused ? (
            <Button
              onClick={resumeTimer}
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-green-400 hover:text-green-300 hover:bg-white/20 border border-white/10"
              title="Resume"
            >
              <Play className="w-2.5 h-2.5" />
            </Button>
          ) : (
            <Button
              onClick={pauseTimer}
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 text-yellow-400 hover:text-yellow-300 hover:bg-white/20 border border-white/10"
              title="Pause"
            >
              <Pause className="w-2.5 h-2.5" />
            </Button>
          )}
          
          {/* Restart button */}
          <Button
            onClick={restartTimer}
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-blue-400 hover:text-blue-300 hover:bg-white/20 border border-white/10"
            title="Restart"
          >
            <RotateCw className="w-2.5 h-2.5" />
          </Button>
          
          {/* Close button */}
          <Button
            onClick={closeTimer}
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-white/70 hover:text-white hover:bg-white/20 border border-white/10"
            title="Close"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}