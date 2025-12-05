"use client";

import { useState } from "react";

export default function Home() {
  const [tasks, setTasks] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleAddTask = () => {
    if (inputValue.trim() !== "") {
      setTasks([...tasks, inputValue.trim()]);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
              Todo リスト
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              タスクを追加して管理しましょう
            </p>
          </div>

          {/* 入力欄 */}
          <div className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="新しいタスクを入力..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
              />
              <button
                onClick={handleAddTask}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                追加
              </button>
            </div>
          </div>

          {/* タスク一覧 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">
              タスク一覧 ({tasks.length})
            </h2>
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                <p className="text-lg">タスクがありません</p>
                <p className="text-sm mt-2">上の入力欄からタスクを追加してください</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {tasks.map((task, index) => (
                  <li
                    key={index}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-gray-800 dark:text-gray-200">
                        {task}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
