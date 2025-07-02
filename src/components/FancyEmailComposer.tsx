import React, { useState } from "react";
import { Send, Sparkles, Mail, PenTool } from "lucide-react";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotTextarea } from "@copilotkit/react-textarea";
import "@copilotkit/react-textarea/styles.css";

export default function FancyEmailComposer() {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  return (
    <CopilotKit publicApiKey="ck_pub_b1b4eb0eba3eaef06e9420f25b491165">
      <div className="w-full mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Compose Email
            </h2>
            <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">
                AI Powered
              </span>
            </div>
          </div>
          <p className="text-gray-600">Craft your message with AI assistance</p>
        </div>

        {/* Main Composer */}
        <div className="relative">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl blur-xl opacity-60 animate-pulse"></div>

          {/* Main Container */}
          <div
            className={`relative bg-white/80 backdrop-blur-sm border-2 rounded-2xl shadow-2xl transition-all duration-500 ${
              isFocused
                ? "border-transparent shadow-blue-200/50 scale-[1.02]"
                : "border-gray-200 hover:border-gray-300 hover:shadow-xl"
            }`}
          >
            {/* Fancy Gradient Border for Main Container when focused */}
            {isFocused && (
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-sm animate-pulse opacity-75"></div>
            )}

            {/* Content with relative positioning */}
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Message Body
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    {text.length} characters
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>

              {/* Text Area Container */}
              <div className="p-6">
                <div
                  className={`relative transition-all duration-300 ${
                    isFocused ? "transform scale-[1.01]" : ""
                  }`}
                >
                  {/* Floating Label */}
                  {!text && !isFocused && (
                    <div className="absolute top-4 left-4 pointer-events-none z-10">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>
                          Start typing your message... AI will assist you
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Enhanced CopilotTextarea with Fancy Border */}
                  <div className="relative">
                    <CopilotTextarea
                      className={`relative w-full min-h-[300px] p-4 rounded-xl resize-none outline-none transition-all duration-500 ${
                        isFocused
                          ? "bg-gradient-to-br from-blue-50/80 via-white to-purple-50/80 border-0 shadow-inner text-gray-800"
                          : "bg-transparent border-2 border-gray-200 hover:border-gray-300 text-gray-800"
                      } placeholder:text-gray-400 leading-relaxed font-medium`}
                      value={text}
                      onValueChange={setText}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder=""
                      autosuggestionsConfig={{
                        textareaPurpose: "the body of an email message",
                        chatApiConfigs: {},
                      }}
                      style={{
                        boxShadow: isFocused
                          ? "inset 0 2px 10px rgba(99, 102, 241, 0.1), 0 0 0 1px rgba(99, 102, 241, 0.1)"
                          : "none",
                      }}
                    />
                  </div>
                </div>

                {/* AI Suggestions Indicator */}
                {text.length > 10 && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-700 font-medium">
                        AI is analyzing your text...
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-r from-pink-400 to-red-400 rounded-full animate-bounce"></div>
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-bounce delay-75"></div>
          <div className="absolute top-1/2 -left-4 w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-ping"></div>
        </div>

        {/* Stats Bar */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:scale-105 transition-transform duration-200">
            <div className="text-2xl font-bold text-blue-600">
              {text.split(" ").filter((word) => word.length > 0).length}
            </div>
            <div className="text-sm text-blue-700">Words</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:scale-105 transition-transform duration-200">
            <div className="text-2xl font-bold text-purple-600">
              {text.split("\n").length}
            </div>
            <div className="text-sm text-purple-700">Paragraphs</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:scale-105 transition-transform duration-200">
            <div className="text-2xl font-bold text-green-600">
              {Math.ceil(text.length / 1000) || 0}
            </div>
            <div className="text-sm text-green-700">Reading Time (min)</div>
          </div>
        </div>
      </div>
    </CopilotKit>
  );
}
