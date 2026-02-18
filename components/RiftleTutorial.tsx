'use client';

import { useState } from 'react';

interface RiftleTutorialProps {
  step: 'intro' | 'feedback';
  onClose: () => void;
}

export default function RiftleTutorial({ step, onClose }: RiftleTutorialProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-6 border-4 border-blue-500 dark:border-blue-400">
        {step === 'intro' ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🎮</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to Riftle!
              </h2>
            </div>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="text-lg">
                <strong>Goal:</strong> Guess the daily Riftbound card in 6 tries or less!
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="font-semibold text-blue-900 dark:text-blue-200 mb-2">How to Play:</p>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Search for any Riftbound card using the search box</li>
                  <li>Click <strong>"Submit Guess"</strong> to make your guess</li>
                  <li>You'll get feedback on each attribute (Type, Faction, Rarity, Energy, Might, Power)</li>
                  <li>Use the feedback to narrow down your next guess</li>
                  <li>Keep guessing until you find the correct card!</li>
                </ol>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 <strong>Tip:</strong> Start with a card you know well to get initial feedback!
              </p>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Got it! Let's Play 🎯
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📊</span>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Understanding Feedback
              </h2>
            </div>
            
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p>After each guess, you'll see colored feedback for each attribute:</p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                  <div className="w-12 h-12 bg-green-500 rounded flex items-center justify-center text-white font-bold text-xl">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-200">Green = Correct!</p>
                    <p className="text-sm text-green-800 dark:text-green-300">This attribute matches the target card</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <div className="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white font-bold text-xl">
                    ✗
                  </div>
                  <div>
                    <p className="font-semibold text-red-900 dark:text-red-200">Red = Wrong</p>
                    <p className="text-sm text-red-800 dark:text-red-300">This attribute doesn't match</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3">
                  <div className="w-12 h-12 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-xl">
                    ↓
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900 dark:text-orange-200">Orange with Arrow Down = Target is Lower</p>
                    <p className="text-sm text-orange-800 dark:text-orange-300">
                      For numbers (Energy, Might, Power): The target card has a lower value
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xl">
                    ↑
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-200">Blue with Arrow Up = Target is Higher</p>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      For numbers (Energy, Might, Power): The target card has a higher value
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Perfect! Continue Playing 🎮
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// Made with Bob
