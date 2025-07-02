import React, { useState, useEffect } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import {
  X,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";

const UpdateChecker = ({ isOpen, onClose }) => {
  const [updateState, setUpdateState] = useState("idle");
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState("");
  const [totalBytes, setTotalBytes] = useState(0);
  const [downloadedBytes, setDownloadedBytes] = useState(0);

  const checkForUpdates = async () => {
    setUpdateState("checking");
    setError("");

    try {
      const update = await check();

      if (update) {
        setUpdateInfo(update);
        setUpdateState("available");
      } else {
        setUpdateState("noUpdate");
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("Update check failed:", err);
      setError(err.message || "Failed to check for updates");
      setUpdateState("error");
    }
  };

  const downloadAndInstall = async () => {
    if (!updateInfo) return;

    setUpdateState("downloading");
    setDownloadProgress(0);
    setDownloadedBytes(0);

    try {
      let totalDownloaded = 0; // Fix: Use local variable

      await updateInfo.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            setTotalBytes(event.data.contentLength || 0);
            break;
          case "Progress":
            totalDownloaded += event.data.chunkLength || 0; // Fix: Accumulate properly
            setDownloadedBytes(totalDownloaded);
            if (totalBytes > 0) {
              setDownloadProgress((totalDownloaded / totalBytes) * 100);
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            setUpdateState("downloaded");
            break;
        }
      });

      setTimeout(async () => {
        await relaunch();
      }, 1000);
    } catch (err) {
      console.error("Update download failed:", err);
      setError(err.message || "Failed to download update");
      setUpdateState("error");
    }
  };

  useEffect(() => {
    if (isOpen && updateState === "idle") {
      checkForUpdates();
    }
  }, [isOpen, updateState]); // Fix: Add dependencies

  useEffect(() => {
    if (!isOpen) {
      setUpdateState("idle");
      setUpdateInfo(null);
      setError("");
      setDownloadProgress(0);
      setDownloadedBytes(0);
      setTotalBytes(0);
    }
  }, [isOpen]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white opacity-10">
            <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full bg-white opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-white opacity-10"></div>
          </div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6" />
              <h2 className="text-xl font-bold">App Updater</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Checking State */}
          {updateState === "checking" && (
            <div className="text-center py-8">
              <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Checking for Updates
              </h3>
              <p className="text-gray-600">
                Please wait while we check for the latest version...
              </p>
            </div>
          )}

          {/* No Update State */}
          {updateState === "noUpdate" && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                You're Up to Date!
              </h3>
              <p className="text-gray-600">
                You're running the latest version of the app.
              </p>
            </div>
          )}

          {/* Update Available State */}
          {updateState === "available" && updateInfo && (
            <div className="py-4">
              <div className="text-center mb-6">
                <Download className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Update Available!
                </h3>
                <p className="text-gray-600 mb-4">
                  A new version is ready to download.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    New Version:
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {updateInfo.version}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">
                    Release Date:
                  </span>
                  <span className="text-sm text-gray-800">
                    {updateInfo.date
                      ? new Date(updateInfo.date).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Later
                </button>
                <button
                  onClick={downloadAndInstall}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Update Now
                </button>
              </div>
            </div>
          )}

          {/* Downloading State */}
          {updateState === "downloading" && (
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <svg
                      className="w-16 h-16 transform -rotate-90"
                      viewBox="0 0 64 64"
                    >
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${
                          2 * Math.PI * 28 * (1 - downloadProgress / 100)
                        }`}
                        className="text-blue-500 transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">
                        {Math.round(downloadProgress)}%
                      </span>
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Downloading Update
                </h3>
                <p className="text-gray-600 mb-4">
                  {downloadedBytes > 0 && totalBytes > 0
                    ? `${formatBytes(downloadedBytes)} of ${formatBytes(
                        totalBytes
                      )}`
                    : "Preparing download..."}
                </p>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Downloaded State */}
          {updateState === "downloaded" && (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Update Downloaded!
              </h3>
              <p className="text-gray-600 mb-4">
                The app will restart automatically to apply the update.
              </p>
              <div className="animate-pulse text-sm text-gray-500">
                Restarting in a moment...
              </div>
            </div>
          )}

          {/* Error State */}
          {updateState === "error" && (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Update Failed
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={checkForUpdates}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpdateChecker;