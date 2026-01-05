"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  ArrowRight
} from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-4 gap-6">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-3xl" />)}
    </div>
    <div className="h-96 bg-gray-200 rounded-3xl" />
  </div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-charcoal">Dashboard</h1>
        <p className="text-charcoal/50">Vítejte zpět v administraci Vybaveno.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sage/10 flex items-center justify-center text-sage">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-charcoal/50 font-medium">Produkty</p>
              <h3 className="text-2xl font-bold text-charcoal">{stats.products}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-terracotta/10 flex items-center justify-center text-terracotta">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-charcoal/50 font-medium">Sessions</p>
              <h3 className="text-2xl font-bold text-charcoal">{stats.sessions}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-charcoal/50 font-medium">Konverze</p>
              <h3 className="text-2xl font-bold text-charcoal">12.5%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-charcoal/50 font-medium">Aktivní dnes</p>
              <h3 className="text-2xl font-bold text-charcoal">42</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Sessions */}
        <Card className="lg:col-span-2 border-none shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Poslední aktivity</CardTitle>
            <Link href="/admin/sessions" className="text-sm text-sage hover:underline flex items-center gap-1">
              Zobrazit vše <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-50">
              {stats.recentSessions.map((session: any) => (
                <div key={session.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sand overflow-hidden">
                      <img src={session.original_image_url} alt="Room" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-charcoal text-sm">{session.id}</p>
                      <p className="text-xs text-charcoal/40">{new Date(session.created_at).toLocaleString('cs-CZ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      session.status === 'analyzed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Brand Distribution */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="border-b border-gray-50">
            <CardTitle className="text-lg font-bold">Zastoupení značek</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {stats.brands.map((brand: any) => (
              <div key={brand.brand} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-charcoal">{brand.brand}</span>
                  <span className="text-charcoal/50">{brand.count} produktů</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${brand.brand === 'IKEA' ? 'bg-blue-600' : 'bg-amber-500'}`} 
                    style={{ width: `${(brand.count / stats.products) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
