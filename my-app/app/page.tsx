"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

type User = {
  id: number;
  name: string;
  email: string;
};

type Task = {
  id: number;
  text: string;
  completed: boolean;
  userId: number;
};

type Comment = {
  id: number;
  taskId: number;
  userId: number;
  userName: string;
  content: string;
  timestamp: number;
};

// 初期ユーザーデータ
const INITIAL_USERS: User[] = [
  { id: 1, name: "田中太郎", email: "tanaka@example.com" },
  { id: 2, name: "佐藤花子", email: "sato@example.com" },
  { id: 3, name: "山田次郎", email: "yamada@example.com" },
];

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInputs, setCommentInputs] = useState<{ [taskId: number]: string }>({});

  // 新規登録フォームの状態
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  // ログインフォームの状態
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // 初期化: ローカルストレージからデータを読み込む
  useEffect(() => {
    const storedUsers = localStorage.getItem("kanban-users");
    const storedCurrentUserId = localStorage.getItem("kanban-current-user-id");
    const storedTasks = localStorage.getItem("kanban-tasks");
    const storedComments = localStorage.getItem("kanban-comments");

    if (storedUsers) {
      const parsedUsers = JSON.parse(storedUsers);
      setUsers(parsedUsers);

      if (storedCurrentUserId) {
        const userId = parseInt(storedCurrentUserId);
        const user = parsedUsers.find((u: User) => u.id === userId);
        if (user) {
          setCurrentUser(user);
        }
      }
    } else {
      // 初回起動時は初期ユーザーをセット
      setUsers(INITIAL_USERS);
      localStorage.setItem("kanban-users", JSON.stringify(INITIAL_USERS));
    }

    if (storedTasks) {
      setTasks(JSON.parse(storedTasks));
    }

    if (storedComments) {
      setComments(JSON.parse(storedComments));
    }
  }, []);

  // ユーザーが変更されたらローカルストレージに保存
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem("kanban-users", JSON.stringify(users));
    }
  }, [users]);

  // 現在のユーザーが変更されたらローカルストレージに保存
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(
        "kanban-current-user-id",
        currentUser.id.toString()
      );
    } else {
      localStorage.removeItem("kanban-current-user-id");
    }
  }, [currentUser]);

  // タスクが変更されたらローカルストレージに保存
  useEffect(() => {
    if (tasks.length >= 0) {
      localStorage.setItem("kanban-tasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // コメントが変更されたらローカルストレージに保存
  useEffect(() => {
    if (comments.length >= 0) {
      localStorage.setItem("kanban-comments", JSON.stringify(comments));
    }
  }, [comments]);

  // 新規登録処理
  const handleRegister = () => {
    if (registerName.trim() === "" || registerEmail.trim() === "") {
      alert("名前とメールアドレスを入力してください");
      return;
    }

    const newUser: User = {
      id: Date.now(),
      name: registerName.trim(),
      email: registerEmail.trim(),
    };

    setUsers([...users, newUser]);
    setCurrentUser(newUser);
    setRegisterName("");
    setRegisterEmail("");
    setShowRegisterForm(false);
  };

  // ログイン処理
  const handleLogin = () => {
    if (selectedUserId === null) {
      alert("ユーザーを選択してください");
      return;
    }

    const user = users.find((u) => u.id === selectedUserId);
    if (user) {
      setCurrentUser(user);
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedUserId(null);
  };

  // タスク追加
  const handleAddTask = () => {
    if (!currentUser) return;

    if (inputValue.trim() !== "") {
      const newTask: Task = {
        id: Date.now(),
        text: inputValue.trim(),
        completed: false,
        userId: currentUser.id,
      };
      setTasks([...tasks, newTask]);
      setInputValue("");
    }
  };

  // タスク完了状態の切り替え
  const toggleTaskCompletion = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // タスク削除
  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // Enterキーでタスク追加
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  // ドラッグアンドドロップのハンドラー
  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetCompleted: boolean) => {
    if (draggedTask && draggedTask.completed !== targetCompleted) {
      setTasks(
        tasks.map((task) =>
          task.id === draggedTask.id
            ? { ...task, completed: targetCompleted }
            : task
        )
      );
    }
    setDraggedTask(null);
  };

  // コメント追加
  const handleAddComment = (taskId: number) => {
    if (!currentUser) return;

    const commentContent = commentInputs[taskId]?.trim();
    if (!commentContent) return;

    const newComment: Comment = {
      id: Date.now(),
      taskId,
      userId: currentUser.id,
      userName: currentUser.name,
      content: commentContent,
      timestamp: Date.now(),
    };

    setComments([...comments, newComment]);
    setCommentInputs({ ...commentInputs, [taskId]: "" });
  };

  // コメント入力欄の更新
  const handleCommentInputChange = (taskId: number, value: string) => {
    setCommentInputs({ ...commentInputs, [taskId]: value });
  };

  // タスクのコメント取得
  const getTaskComments = (taskId: number) => {
    return comments
      .filter((comment) => comment.taskId === taskId)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  // 現在のユーザーのタスクのみフィルタリング
  const userTasks = currentUser
    ? tasks.filter((task) => task.userId === currentUser.id)
    : [];
  const incompleteTasks = userTasks.filter((task) => !task.completed);
  const completedTasks = userTasks.filter((task) => task.completed);

  // ログインしていない場合の画面
  if (!currentUser) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            {/* ロゴ・タイトル */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                カンバンボード
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                タスク管理を始めましょう
              </p>
            </div>

            {!showRegisterForm ? (
              <>
                {/* ログインフォーム */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ユーザーを選択
                    </label>
                    <select
                      value={selectedUserId || ""}
                      onChange={(e) =>
                        setSelectedUserId(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                    >
                      <option value="">ユーザーを選択してください</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleLogin}
                    className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    ログイン
                  </button>
                </div>

                {/* 区切り線 */}
                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                  <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
                    または
                  </span>
                  <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
                </div>

                {/* 新規登録ボタン */}
                <button
                  onClick={() => setShowRegisterForm(true)}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  新規登録
                </button>
              </>
            ) : (
              <>
                {/* 新規登録フォーム */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      名前
                    </label>
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="田中太郎"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="tanaka@example.com"
                      className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <button
                    onClick={handleRegister}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                  >
                    登録して始める
                  </button>

                  <button
                    onClick={() => {
                      setShowRegisterForm(false);
                      setRegisterName("");
                      setRegisterEmail("");
                    }}
                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold rounded-lg transition-all"
                  >
                    戻る
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ログイン後の画面（カンバンボード）
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-2">
                カンバンボード
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                タスクをドラッグして管理しましょう
              </p>
            </div>

            {/* ユーザー情報とログアウト */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg px-6 py-4 flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ようこそ
                </p>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">
                  {currentUser.name}さん
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {/* 入力欄 */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
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
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg hover:scale-105"
              >
                追加
              </button>
            </div>
          </div>
        </div>

        {/* カンバンボード */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 未完了カラム */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(false)}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                  未完了
                </h2>
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-3 py-1 rounded-full text-sm font-semibold">
                  {incompleteTasks.length}
                </span>
              </div>
              <div className="mt-2 h-1 bg-yellow-500 rounded-full"></div>
            </div>

            <div className="space-y-3">
              {incompleteTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <p className="text-lg">タスクがありません</p>
                  <p className="text-sm mt-2">
                    上の入力欄からタスクを追加してください
                  </p>
                </div>
              ) : (
                incompleteTasks.map((task) => {
                  const taskComments = getTaskComments(task.id);
                  return (
                    <div
                      key={task.id}
                      className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-700 border-2 border-yellow-200 dark:border-gray-600 rounded-lg p-4 shadow-md hover:shadow-xl transition-all"
                    >
                      <div
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        className="cursor-move"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                            className="flex-shrink-0 mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-gray-800 dark:text-gray-200 font-medium">
                              {task.text}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-all group"
                            aria-label="タスクを削除"
                          >
                            <span className="text-red-600 dark:text-red-400 font-bold text-lg group-hover:scale-110 transition-transform">
                              ×
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* コメントセクション */}
                      <div className="border-t border-yellow-300 dark:border-gray-600 pt-3 mt-3">
                        {/* コメント一覧 */}
                        <div className="mb-3 space-y-2">
                          {taskComments.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                              コメントはありません
                            </p>
                          ) : (
                            taskComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-gray-100 dark:bg-gray-600/50 rounded-lg p-2"
                              >
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  {comment.userName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {comment.content}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* コメント入力 */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[task.id] || ""}
                            onChange={(e) =>
                              handleCommentInputChange(task.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(task.id);
                              }
                            }}
                            placeholder="コメントを追加..."
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-600 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                          />
                          <button
                            onClick={() => handleAddComment(task.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all"
                          >
                            追加
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 完了済みカラム */}
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 min-h-[500px]"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(true)}
          >
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  完了済み
                </h2>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                  {completedTasks.length}
                </span>
              </div>
              <div className="mt-2 h-1 bg-green-500 rounded-full"></div>
            </div>

            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500">
                  <p className="text-lg">完了したタスクがありません</p>
                  <p className="text-sm mt-2">
                    タスクを完了すると、ここに表示されます
                  </p>
                </div>
              ) : (
                completedTasks.map((task) => {
                  const taskComments = getTaskComments(task.id);
                  return (
                    <div
                      key={task.id}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-700 border-2 border-green-200 dark:border-gray-600 rounded-lg p-4 shadow-md hover:shadow-xl transition-all"
                    >
                      <div
                        draggable
                        onDragStart={() => handleDragStart(task)}
                        className="cursor-move"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTaskCompletion(task.id)}
                            className="flex-shrink-0 mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-gray-500 dark:text-gray-400 line-through">
                              {task.text}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-all group"
                            aria-label="タスクを削除"
                          >
                            <span className="text-red-600 dark:text-red-400 font-bold text-lg group-hover:scale-110 transition-transform">
                              ×
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* コメントセクション */}
                      <div className="border-t border-green-300 dark:border-gray-600 pt-3 mt-3">
                        {/* コメント一覧 */}
                        <div className="mb-3 space-y-2">
                          {taskComments.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                              コメントはありません
                            </p>
                          ) : (
                            taskComments.map((comment) => (
                              <div
                                key={comment.id}
                                className="bg-gray-100 dark:bg-gray-600/50 rounded-lg p-2"
                              >
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                  {comment.userName}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {comment.content}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* コメント入力 */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={commentInputs[task.id] || ""}
                            onChange={(e) =>
                              handleCommentInputChange(task.id, e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddComment(task.id);
                              }
                            }}
                            placeholder="コメントを追加..."
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 bg-white dark:bg-gray-600 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                          />
                          <button
                            onClick={() => handleAddComment(task.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-all"
                          >
                            追加
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-center gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {userTasks.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  総タスク数
                </p>
              </div>
              <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {incompleteTasks.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  未完了
                </p>
              </div>
              <div className="w-px h-12 bg-gray-300 dark:bg-gray-600"></div>
              <div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {completedTasks.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  完了済み
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
