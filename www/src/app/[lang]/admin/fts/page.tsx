"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, RotateCw, Play, Search, Tags, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function FTSAdminPage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [synonyms, setSynonyms] = useState<any[]>([]);
  const [newMapping, setNewMapping] = useState({ term: "", category: "", priority: 0 });
  const [newSynonym, setNewSynonym] = useState({ source_term: "", synonym: "", weight: 1.0 });
  const [testQuery, setTestQuery] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mRes, sRes] = await Promise.all([
        fetch("/api/admin/fts/mappings"),
        fetch("/api/admin/fts/synonyms")
      ]);
      setMappings(await mRes.json());
      setSynonyms(await sRes.json());
    } catch (err) {
      console.error("Failed to fetch FTS data", err);
    }
  };

  const handleAddMapping = async () => {
    try {
      const res = await fetch("/api/admin/fts/mappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMapping)
      });
      if (!res.ok) throw new Error("Failed to add mapping");
      setNewMapping({ term: "", category: "", priority: 0 });
      fetchData();
    } catch (err) {
      alert("Chyba při přidávání mapování");
    }
  };

  const handleDeleteMapping = async (id: number) => {
    try {
      await fetch(`/api/admin/fts/mappings/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert("Chyba při mazání mapování");
    }
  };

  const handleAddSynonym = async () => {
    try {
      const res = await fetch("/api/admin/fts/synonyms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSynonym)
      });
      if (!res.ok) throw new Error("Failed to add synonym");
      setNewSynonym({ source_term: "", synonym: "", weight: 1.0 });
      fetchData();
    } catch (err) {
      alert("Chyba při přidávání synonyma");
    }
  };

  const handleDeleteSynonym = async (id: number) => {
    try {
      await fetch(`/api/admin/fts/synonyms/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert("Chyba při mazání synonyma");
    }
  };

  const handleTest = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: testQuery })
      });
      setTestResult(await res.json());
    } catch (err) {
      alert("Chyba při testování FTS");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCache = async () => {
    await fetch("/api/admin/fts/refresh", { method: "POST" });
    alert("Cache byla obnovena");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-heading font-bold text-charcoal">FTS Ladění</h1>
        <Button onClick={handleRefreshCache} variant="outline" className="gap-2">
          <RotateCw className="w-4 h-4" />
          Obnovit Cache
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Term Mappings */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tags className="w-5 h-5 text-sage" />
              Mapování termínů
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2 mb-6">
              <Input 
                placeholder="term (např. obraz)" 
                value={newMapping.term} 
                onChange={e => setNewMapping({...newMapping, term: e.target.value})}
              />
              <Input 
                placeholder="kategorie" 
                value={newMapping.category} 
                onChange={e => setNewMapping({...newMapping, category: e.target.value})}
              />
              <Button onClick={handleAddMapping} disabled={!newMapping.term || !newMapping.category}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {mappings.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 group">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{m.term}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <Badge variant="secondary" className="bg-sage/10 text-sage hover:bg-sage/20 border-none">
                      {m.category}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteMapping(m.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Synonyms */}
        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-terracotta" />
              Synonyma
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex gap-2 mb-6">
              <Input 
                placeholder="term" 
                value={newSynonym.source_term} 
                onChange={e => setNewSynonym({...newSynonym, source_term: e.target.value})}
              />
              <Input 
                placeholder="synonymum" 
                value={newSynonym.synonym} 
                onChange={e => setNewSynonym({...newSynonym, synonym: e.target.value})}
              />
              <Button onClick={handleAddSynonym} disabled={!newSynonym.source_term || !newSynonym.synonym}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {synonyms.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 group">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{s.source_term}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="text-charcoal/70">{s.synonym}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteSynonym(s.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Panel */}
      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="border-b border-gray-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-500" />
            🧪 Test Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-3 mb-8">
            <Input 
              className="max-w-xl h-12 text-lg px-6"
              placeholder="Zadejte dotaz (např. moderní obraz do obýváku)" 
              value={testQuery}
              onChange={e => setTestQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleTest()}
            />
            <Button className="h-12 px-8 gap-2" onClick={handleTest} disabled={loading}>
              {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Testovat FTS
            </Button>
          </div>

          {testResult && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-charcoal/50 font-medium mb-1">ROZPOZNANÁ KATEGORIE</p>
                  <p className="font-bold text-lg">{testResult.category || "—"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-charcoal/50 font-medium mb-1">FTS QUERY (Rozšířený)</p>
                  <p className="font-mono text-sage font-bold uppercase">{testResult.cleanQuery || "—"}</p>
                </div>
                <div className="p-4 rounded-2xl bg-gray-50">
                  <p className="text-xs text-charcoal/50 font-medium mb-1">POČET VÝSLEDKŮ</p>
                  <p className="font-bold text-lg">{testResult.resultsCount}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  Top výsledky
                  <Badge variant="outline" className="font-normal">{testResult.results.length} náhledů</Badge>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {testResult.results.map((p: any) => (
                    <div key={p.id} className="border border-gray-100 rounded-2xl p-3 bg-white">
                      <div className="aspect-square rounded-xl bg-gray-50 mb-3 overflow-hidden">
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-bold truncate mb-1">{p.name}</p>
                      <p className="text-[10px] text-charcoal/50">{p.brand}</p>
                      <p className="text-xs font-bold text-sage mt-2">{p.price_czk} Kč</p>
                    </div>
                  ))}
                  {testResult.results.length === 0 && (
                    <p className="col-span-full text-center py-12 text-charcoal/30 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                      Žádné výsledky nenalezeny. Zkuste přidat synonyma nebo upravit kategorii.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
