"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewAccommodationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    // URL에서 플랫폼 자동 감지
    const url = formData.get("url") as string;
    let platform = "AIRBNB";
    if (url.includes("agoda")) {
      platform = "AGODA";
    }

    const data = {
      name: formData.get("name"),
      platform,
      url,
      checkIn: formData.get("checkIn"),
      checkOut: formData.get("checkOut"),
      adults: parseInt(formData.get("adults") as string) || 2,
    };

    try {
      const res = await fetch("/api/accommodations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "숙소 추가에 실패했습니다");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
            ← 대시보드로 돌아가기
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-2xl font-bold mb-6">숙소 추가</h1>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                숙소 이름 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="예: 그린델발트 샬레"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                숙소 URL *
              </label>
              <input
                type="url"
                id="url"
                name="url"
                required
                placeholder="https://www.airbnb.co.kr/rooms/12345678"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Airbnb 또는 Agoda 숙소 페이지 URL을 입력하세요
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkIn"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  체크인 *
                </label>
                <input
                  type="date"
                  id="checkIn"
                  name="checkIn"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label
                  htmlFor="checkOut"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  체크아웃 *
                </label>
                <input
                  type="date"
                  id="checkOut"
                  name="checkOut"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="adults"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                인원
              </label>
              <input
                type="number"
                id="adults"
                name="adults"
                min="1"
                max="20"
                defaultValue="2"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? "추가 중..." : "숙소 추가"}
              </button>
              <Link
                href="/dashboard"
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
