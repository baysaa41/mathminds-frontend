import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/axiosConfig';

// -------------------------------
// Клубуудын жагсаалт
// -------------------------------
export default function ClubsList() {
    const [search, setSearch] = useState('');

    // -------------------------------
    // React Query hook (v5 syntax)
    // -------------------------------
    const {
        data,
        isPending,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['clubs', search],
        queryFn: async () => {
            const response = await apiClient.get(`/api/clubs/?search=${search}`);
            return response.data;
        },
        staleTime: 1000 * 60, // 1 минут cache
        retry: 1, // дахин оролдох тоо
    });

    // -------------------------------
    // Render states
    // -------------------------------
    if (isPending) {
        return (
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-2">⏳ Клубуудыг ачаалж байна...</h2>
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-6 text-red-600">
                ⚠️ Алдаа гарлаа: {error?.message || 'Мэдээлэл татахад алдаа гарлаа.'}
                <button
                    onClick={() => refetch()}
                    className="ml-4 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                    Дахин оролдох
                </button>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="p-6 text-gray-600">
                <h2 className="text-lg font-semibold mb-2">Клуб олдсонгүй 😕</h2>
                <p>Та хайлтын үгээ шалгана уу эсвэл шинэ клуб үүсгээрэй.</p>
            </div>
        );
    }

    // -------------------------------
    // Sort clubs by category
    // -------------------------------
    const official = data.filter((c) => c.is_official);
    const promoted = data.filter((c) => !c.is_official && c.is_promoted);
    const others = data.filter((c) => !c.is_official && !c.is_promoted);

    // -------------------------------
    // Main view
    // -------------------------------
    return (
        <div className="p-6 space-y-8">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Клубууд</h1>
            </div>

            <input
                type="text"
                placeholder="Клуб хайх..."
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring focus:ring-blue-300"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />

            <ClubSection title="📘 Албан ёсны клубууд" clubs={official} />
            <ClubSection title="⭐ Онцлох клубууд" clubs={promoted} />
            <ClubSection title="👥 Бусад клубууд" clubs={others} />
        </div>
    );
}

// -------------------------------
// Клубын бүлэг тус бүрийн хэсэг
// -------------------------------
function ClubSection({ title, clubs }) {
    if (!clubs || clubs.length === 0) return null;

    return (
        <section>
            <h2 className="font-semibold text-xl mb-3">{title}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {clubs.map((club) => (
                    <ClubCard key={club.id} club={club} />
                ))}
            </div>
        </section>
    );
}

// -------------------------------
// Клубын карт
// -------------------------------
function ClubCard({ club }) {
    return (
        <div className="border rounded-lg p-4 hover:shadow transition duration-200 ease-in-out bg-white">
            <h3 className="text-lg font-semibold mb-1 text-gray-900">{club.name}</h3>
            <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                {club.description || 'Тайлбар байхгүй.'}
            </p>
            <div className="text-xs text-gray-500 flex justify-between items-center">
                <span>👤 {club.creator_name}</span>
                <span>{club.member_count} гишүүн</span>
            </div>
        </div>
    );
}
