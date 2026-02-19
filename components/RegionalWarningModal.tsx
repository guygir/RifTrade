'use client';

import { useState } from 'react';
import { getRestrictionDetails } from '@/lib/geo-utils';

interface RegionalWarningModalProps {
  onClose: () => void;
}

export default function RegionalWarningModal({ onClose }: RegionalWarningModalProps) {
  const details = getRestrictionDetails();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {details.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            {details.message}
          </p>
        </div>

        {/* What You Can Do */}
        <div className="mb-4">
          <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            What You Can Do:
          </h3>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {details.allowed.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What's Not Available */}
        <div className="mb-6">
          <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Not Available:
          </h3>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {details.notAllowed.map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-orange-500 mr-2">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Continue to Riftle
        </button>
      </div>
    </div>
  );
}

// Made with Bob
