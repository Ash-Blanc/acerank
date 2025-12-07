
import React, { useState, useEffect } from 'react';
import { Subject, StudyMaterial } from '../types';
import { db } from '../services/db';
import { generateStudyMaterial } from '../services/geminiService';
import { 
  FileText, Plus, Search, Trash2, Download, BookOpen, 
  Video, Hash, Loader2, Sparkles, X, ChevronRight, Bookmark
} from 'lucide-react';

const SAMPLE_TOPICS = [
  'Rotational Motion', 'Thermodynamics', 'Electrostatics', 
  'Integration', 'Vectors', 'Chemical Bonding', 'Organic Mechanisms'
];

export const MaterialExplorer: React.FC = () => {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  // Generation Modal State
  const [showGenerator, setShowGenerator] = useState(false);
  const [genTopic, setGenTopic] = useState('');
  const [genType, setGenType] = useState<'note' | 'formula_sheet' | 'quiz' | 'summary'>('summary');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
        setLoading(true);
        const data = await db.getAllMaterials();
        setMaterials(data.sort((a,b) => b.createdAt - a.createdAt));
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!genTopic) return;
    setIsGenerating(true);
    try {
        const content = await generateStudyMaterial(genTopic, genType);
        // Infer Subject (Mock logic, in production AI could classify)
        let inferredSubject = Subject.PHYSICS;
        const topicLower = genTopic.toLowerCase();
        if (topicLower.includes('chem') || topicLower.includes('organic') || topicLower.includes('bond')) inferredSubject = Subject.CHEMISTRY;
        else if (topicLower.includes('math') || topicLower.includes('calc') || topicLower.includes('algebra')) inferredSubject = Subject.MATH;

        const newMaterial: StudyMaterial = {
            id: Date.now().toString(),
            title: `${genTopic} - ${formatType(genType)}`,
            type: genType,
            subject: inferredSubject, // simplified for demo
            topic: genTopic,
            content: content || '',
            createdAt: Date.now(),
            tags: ['AI Generated', genType]
        };
        await db.saveMaterial(newMaterial);
        await loadMaterials();
        setShowGenerator(false);
        setGenTopic('');
        setSelectedMaterial(newMaterial); // Auto-select new material
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this resource?')) {
        await db.deleteMaterial(id);
        setMaterials(prev => prev.filter(m => m.id !== id));
        if (selectedMaterial?.id === id) setSelectedMaterial(null);
    }
  };

  const formatType = (t: string) => t.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full bg-black text-neutral-200 font-sans">
      {/* Sidebar List */}
      <div className={`${selectedMaterial ? 'hidden md:flex' : 'flex'} w-full md:w-96 flex-col border-r border-neutral-800 bg-neutral-950`}>
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/50">
           <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-mono tracking-tight">
             <BookOpen size={18} /> LIBRARY
           </h2>
           <div className="relative mb-3">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
             <input 
               type="text" 
               placeholder="Search materials..."
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               className="w-full bg-black border border-neutral-800 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-700 transition-colors font-sans placeholder:text-neutral-600"
             />
           </div>
           <button 
             onClick={() => setShowGenerator(true)}
             className="w-full py-3 bg-white text-black font-bold text-xs uppercase rounded hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
           >
             <Plus size={14} /> AI Generate New
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-black">
          {loading ? (
             <div className="flex justify-center py-12"><Loader2 className="animate-spin text-neutral-600"/></div>
          ) : filteredMaterials.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-12 text-neutral-600 text-xs font-mono text-center">
               <Bookmark size={32} className="mb-3 opacity-20" />
               <p>{searchQuery ? 'No matches found.' : 'Library empty.\nGenerate your first resource.'}</p>
             </div>
          ) : (
            filteredMaterials.map(mat => (
              <div 
                key={mat.id}
                onClick={() => setSelectedMaterial(mat)}
                className={`group p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedMaterial?.id === mat.id 
                    ? 'bg-neutral-900 border-neutral-700 shadow-md' 
                    : 'bg-neutral-950 border-neutral-900 hover:bg-neutral-900 hover:border-neutral-800'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-3 text-sm font-medium text-white truncate flex-1">
                      {getTypeIcon(mat.type)}
                      <span className="truncate">{mat.title}</span>
                   </div>
                   <button onClick={(e) => handleDelete(mat.id, e)} className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <Trash2 size={12} />
                   </button>
                </div>
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pl-7">
                   <span>{new Date(mat.createdAt).toLocaleDateString()}</span>
                   <div className="flex gap-2">
                       <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400">{mat.subject.substring(0,4)}</span>
                       <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-400 uppercase">{mat.type.replace('_',' ')}</span>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Content Preview */}
      <div className={`${selectedMaterial ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-neutral-900/30`}>
         {selectedMaterial ? (
            <>
               <div className="p-4 border-b border-neutral-800 bg-neutral-950 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <button onClick={() => setSelectedMaterial(null)} className="md:hidden text-neutral-400 hover:text-white">
                        <ChevronRight className="rotate-180" />
                     </button>
                     <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">{selectedMaterial.title}</h1>
                        <div className="flex gap-2 text-xs text-neutral-500 font-mono mt-1 items-center">
                           <span className="text-blue-400">{selectedMaterial.subject}</span> 
                           <span>•</span> 
                           <span>{new Date(selectedMaterial.createdAt).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex gap-2">
                     <button className="p-2 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors" title="Download">
                        <Download size={18} />
                     </button>
                  </div>
               </div>
               <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black">
                  <article className="prose prose-invert prose-neutral max-w-3xl mx-auto font-sans leading-relaxed">
                     <div className="whitespace-pre-wrap">{selectedMaterial.content}</div>
                  </article>
               </div>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-600 p-8 text-center">
               <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-6 border border-neutral-800">
                  <BookOpen size={40} className="text-neutral-700" />
               </div>
               <h3 className="text-lg font-bold text-neutral-400 mb-2">Select a resource to view</h3>
               <p className="text-sm font-mono text-neutral-600 max-w-xs">Browse your generated notes, formula sheets, and quizzes from the sidebar.</p>
            </div>
         )}
      </div>

      {/* Generator Modal */}
      {showGenerator && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-neutral-950 border border-neutral-800 w-full max-w-md p-6 rounded-2xl shadow-2xl animate-fade-in relative">
               <button onClick={() => setShowGenerator(false)} className="absolute right-4 top-4 text-neutral-500 hover:text-white transition-colors">
                  <X size={20} />
               </button>
               
               <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="text-amber-400" size={20} /> AI Resource Generator
               </h3>
               
               <div className="space-y-5">
                  <div>
                     <label className="block text-xs font-mono text-neutral-400 mb-2 uppercase tracking-wider">Topic / Concept</label>
                     <input 
                        value={genTopic}
                        onChange={e => setGenTopic(e.target.value)}
                        placeholder="e.g. Rotational Inertia"
                        className="w-full bg-black border border-neutral-800 rounded-lg p-3 text-white focus:border-white focus:outline-none transition-colors"
                     />
                     <div className="flex flex-wrap gap-2 mt-3">
                        {SAMPLE_TOPICS.slice(0, 4).map(t => (
                           <button key={t} onClick={() => setGenTopic(t)} className="text-[10px] bg-neutral-900 border border-neutral-800 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-400 transition-colors">
                              {t}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-mono text-neutral-400 mb-2 uppercase tracking-wider">Material Type</label>
                     <div className="grid grid-cols-2 gap-3">
                        {['summary', 'formula_sheet', 'quiz', 'note'].map((t) => (
                           <button
                              key={t}
                              onClick={() => setGenType(t as any)}
                              className={`p-3 text-sm font-medium rounded-lg border transition-all ${
                                 genType === t 
                                 ? 'bg-white text-black border-white' 
                                 : 'bg-black text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200'
                              }`}
                           >
                              {formatType(t)}
                           </button>
                        ))}
                     </div>
                  </div>
                  
                  <button 
                     onClick={handleGenerate}
                     disabled={isGenerating || !genTopic}
                     className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold uppercase tracking-wider rounded-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-900/20 transition-all"
                  >
                     {isGenerating ? <Loader2 className="animate-spin" /> : 'Generate Content'}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const getTypeIcon = (type: string) => {
   switch(type) {
      case 'formula_sheet': return <Hash size={16} className="text-emerald-400" />;
      case 'video': return <Video size={16} className="text-red-400" />;
      case 'quiz': return <Loader2 size={16} className="text-amber-400" />;
      default: return <FileText size={16} className="text-blue-400" />;
   }
};
