import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  fetchSettings,
  updateSettings,
  testOllamaConnection,
} from "../api/client";
import type { AppSettings } from "../types";

export default function Settings() {
  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const [form, setForm] = useState<Partial<AppSettings>>({});
  const [testResult, setTestResult] = useState<{
    connected: boolean;
    models: string[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () => updateSettings(form),
  });

  const testMutation = useMutation({
    mutationFn: testOllamaConnection,
    onSuccess: (result) => setTestResult(result),
  });

  if (isLoading) return <div className="p-8 text-gray-500 text-sm">Loading settings…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configure Ollama connection and monthly budget
        </p>
      </div>

      <div className="space-y-6">
        {/* Ollama section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Ollama Connection</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ollama URL</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="http://localhost:11434"
                value={form.ollama_url ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, ollama_url: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Deep Thinking Model</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="gemma4"
                value={form.deep_thinking_model ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, deep_thinking_model: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quick Thinking Model</label>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="gemma4"
                value={form.quick_thinking_model ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, quick_thinking_model: e.target.value }))
                }
              />
            </div>
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors disabled:opacity-40"
            >
              {testMutation.isPending ? "Testing…" : "Test Connection"}
            </button>
            {testResult && (
              <div
                className={`rounded-lg p-4 text-sm ${
                  testResult.connected
                    ? "bg-emerald-900/30 border border-emerald-800 text-emerald-300"
                    : "bg-red-900/30 border border-red-800 text-red-300"
                }`}
              >
                {testResult.connected ? (
                  <>
                    <p className="font-semibold">Connected!</p>
                    {testResult.models.length > 0 && (
                      <p className="text-xs mt-1 text-emerald-400">
                        Available models: {testResult.models.join(", ")}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-semibold">Connection failed</p>
                    {testResult.error && (
                      <p className="text-xs mt-1 opacity-80">{testResult.error}</p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Budget section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Monthly Budget</h2>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Budget (EUR)</label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">€</span>
              <input
                type="number"
                min={0}
                step={100}
                className="w-40 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                value={form.monthly_budget ?? 1000}
                onChange={(e) =>
                  setForm((f) => ({ ...f, monthly_budget: parseFloat(e.target.value) }))
                }
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saveMutation.isPending ? "Saving…" : "Save Settings"}
          </button>
          {saveMutation.isSuccess && (
            <span className="text-sm text-emerald-400">Saved!</span>
          )}
          {saveMutation.isError && (
            <span className="text-sm text-red-400">Failed to save.</span>
          )}
        </div>
      </div>
    </div>
  );
}
