import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useEffect, useState } from 'react';

const UpdateChecker = () => {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const unlistenProgress = listen('download-progress', (event) => {
      setProgress(event.payload as number);
    });

    const unlistenFinished = listen('download-finished', () => {
      setDownloading(false);
      // App will restart automatically
    });

    return () => {
      unlistenProgress.then(fn => fn());
      unlistenFinished.then(fn => fn());
    };
  }, []);

  const checkForUpdates = async () => {
    setChecking(true);
    try {
      const hasUpdate = await invoke<boolean>('check_for_updates');
      setUpdateAvailable(hasUpdate);
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
    setChecking(false);
  };

  const downloadUpdate = async () => {
    setDownloading(true);
    try {
      await invoke('download_and_install_update');
    } catch (error) {
      console.error('Failed to download update:', error);
      setDownloading(false);
    }
  };

  return (
    <div>
      <button onClick={checkForUpdates} disabled={checking}>
        {checking ? 'Checking...' : 'Check for Updates'}
      </button>
      
      {updateAvailable && (
        <div>
          <p>Update available!</p>
          <button onClick={downloadUpdate} disabled={downloading}>
            {downloading ? `Downloading... ${progress.toFixed(1)}%` : 'Download & Install'}
          </button>
        </div>
      )}
    </div>
  );
};

export default UpdateChecker;