'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const router = useRouter();
  const [restaurantId, setRestaurantId] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 mb-6 mx-auto">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white text-center mb-1">Kitchen Display</h1>
        <p className="text-sm text-gray-400 text-center mb-6">Enter your restaurant ID to continue</p>
        <input
          value={restaurantId}
          onChange={e => setRestaurantId(e.target.value)}
          placeholder="Restaurant ID (UUID)"
          className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm mb-4"
        />
        <button
          onClick={() => restaurantId && router.push(`/${restaurantId}`)}
          disabled={!restaurantId.trim()}
          className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors"
        >
          Open Kitchen Board →
        </button>
      </div>
    </div>
  );
}
