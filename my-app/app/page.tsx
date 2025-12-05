"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

type User = {
  id: number;
  name: string;
  email: string;
};

type Task = {
  id: number;
  text: string;
  completed: boolean;
  user_id: number;
};

type Comment = {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  content: string;
};

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInputs, setCommentInputs] = useState<{ [taskId: number]: string }>({});
  const [loading, setLoading] = useState(true);

  // 新規登録フォームの状態
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");

  // ログインフォームの状態
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // 初期化: Supabaseからユーザー一覧を取得
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('id');

      if (error) {
        console.error('Error fetching users:', error);
      } else if (data) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();

    // ログイン状態の復元（localStorage使用）
    const storedUserId = localStorage.getItem("kanban-current-user-id");
    if (storedUserId) {
      const userId = parseInt(storedUserId);
      fetchUserById(userId);
    }
  }, []);

  // ユーザーIDからユーザー情報を取得
  const fetchUserById = async (userId: number) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
    } else if (data) {
      setCurrentUser(data);
    }
  };

  // ログイン時にタスクとコメントを取得
  useEffect(() => {
    if (currentUser) {
      fetchTasks();
      fetchComments();
      localStorage.setItem("kanban-current-user-id", currentUser.id.toString());
    } else {
      localStorage.removeItem("kanban-current-user-id");
      setTasks([]);
      setComments([]);
    }
  }, [currentUser]);

  // タスク取得
  const fetchTasks = async () => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('id');

    if (error) {
      console.error('Error fetching tasks:', error);
    } else if (data) {
      setTasks(data);
    }
  };

  // コメント取得
  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('id');

    if (error) {
      console.error('Error fetching comments:', error);
    } else if (data) {
      setComments(data);
    }
  };

  // 新規登録処理
  const handleRegister = async () => {
    if (registerName.trim() === "" || registerEmail.trim() === "") {
      alert("名前とメールアドレスを入力してください");
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          name: registerName.trim(),
          email: registerEmail.trim(),
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        alert("このメールアドレスは既に登録されています");
      } else {
        console.error('Error registering user:', error);
        alert("登録に失敗しました");
      }
      return;
    }

    if (data) {
      setUsers([...users, data]);
      setCurrentUser(data);
      setRegisterName("");
      setRegisterEmail("");
      setShowRegisterForm(false);
    }
  };

  // ログイン処理
  const handleLogin = async () => {
    if (selectedUserId === null) {
      alert("ユーザーを選択してください");
      return;
    }

    await fetchUserById(selectedUserId);
  };

  // ログアウト処理
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedUserId(null);
  };

  // タスク追加
  const handleAddTask = async () => {
    if (!currentUser) return;

    if (inputValue.trim() !== "") {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            user_id: currentUser.id,
            text: inputValue.trim(),
            completed: false,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error adding task:', error);
        alert("タスクの追加に失敗しました");
      } else if (data) {
        setTasks([...tasks, data]);
        setInputValue("");
      }
    }
  };

  // タスク完了状態の切り替え
  const toggleTaskCompletion = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      alert("タスクの更新に失敗しました");
    } else {
      setTasks(
        tasks.map((t) =>
          t.id === id ? { ...t, completed: !t.completed } : t
        )
      );
    }
  };

  // タスク削除
  const handleDeleteTask = async (id: number) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      alert("タスクの削除に失敗しました");
    } else {
      setTasks(tasks.filter((task) => task.id !== id));
      // タスクに紐づくコメントも削除（カスケード削除されるが、ローカルステートも更新）
      setComments(comments.filter((comment) => comment.task_id !== id));
    }
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

  const handleDrop = async (targetCompleted: boolean) => {
    if (draggedTask && draggedTask.completed !== targetCompleted) {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: targetCompleted })
        .eq('id', draggedTask.id);

      if (error) {
        console.error('Error updating task:', error);
        alert("タスクの更新に失敗しました");
      } else {
        setTasks(
          tasks.map((task) =>
            task.id === draggedTask.id
              ? { ...task, completed: targetCompleted }
              : task
          )
        );
      }
    }
    setDraggedTask(null);
  };

  // コメント追加
  const handleAddComment = async (taskId: number) => {
    if (!currentUser) return;

    const commentContent = commentInputs[taskId]?.trim();
    if (!commentContent) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          task_id: taskId,
          user_id: currentUser.id,
          user_name: currentUser.name,
          content: commentContent,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding comment:', error);
      alert("コメントの追加に失敗しました");
    } else if (data) {
      setComments([...comments, data]);
      setCommentInputs({ ...commentInputs, [taskId]: "" });
    }
  };

  // コメント入力欄の更新
  const handleCommentInputChange = (taskId: number, value: string) => {
    setCommentInputs({ ...commentInputs, [taskId]: value });
  };

  // タスクのコメント取得
  const getTaskComments = (taskId: number) => {
    return comments
      .filter((comment) => comment.task_id === taskId)
      .sort((a, b) => a.id - b.id);
  };

  // 現在のユーザーのタスクのみフィルタリング
  const userTasks = currentUser
    ? tasks.filter((task) => task.user_id === currentUser.id)
    : [];
  const incompleteTasks = userTasks.filter((task) => !task.completed);
  const completedTasks = userTasks.filter((task) => task.completed);

  // ローディング中
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">読み込み中...</p>
        </div>
      </main>
    );
  }

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
                                  {comment.user_name}
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
                                  {comment.user_name}
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
