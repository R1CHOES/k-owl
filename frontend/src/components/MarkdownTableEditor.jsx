import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownTableEditor = ({ markdownText, setMarkdownText }) => {
    const [viewMode, setViewMode] = useState('preview');

    const renderers = {
        h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-[#123971] mt-6 mb-4" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-xl font-bold text-[#123971] mt-5 mb-3" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-lg font-bold text-[#123971] mt-4 mb-2" {...props} />,
        p: ({node, ...props}) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
        table: ({node, ...props}) => (
            <div className="overflow-x-auto mb-6 border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-sm text-left text-gray-700" {...props} />
            </div>
        ),
        thead: ({node, ...props}) => <thead className="text-xs text-white uppercase bg-cyan-600" {...props} />,
        th: ({node, ...props}) => <th className="px-4 py-3 border-b border-r border-cyan-700" {...props} />,
        tr: ({node, ...props}) => <tr className="border-b hover:bg-gray-50 transition-colors" {...props} />,
        td: ({node, ...props}) => <td className="px-4 py-3 border-r border-gray-200 align-top" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 text-gray-700" {...props} />,
        ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 text-gray-700" {...props} />,
        li: ({node, ...props}) => <li className="mb-1" {...props} />,
        a: ({node, ...props}) => <a className="text-cyan-600 hover:underline font-medium" {...props} />
    };

    return (
        <div className="w-full border border-gray-300 rounded-lg overflow-hidden flex flex-col bg-white">
            <div className="flex border-b border-gray-200 bg-gray-50">
                <button
                    onClick={() => setViewMode('preview')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${viewMode === 'preview' ? 'bg-[#123971] text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                    Document Preview
                </button>
                <button
                    onClick={() => setViewMode('edit')}
                    className={`flex-1 py-3 text-sm font-bold transition-colors ${viewMode === 'edit' ? 'bg-cyan-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
                >
                    Raw Edit
                </button>
            </div>
            
            <div className="p-6 min-h-[400px] max-h-[60vh] overflow-y-auto bg-white">
                {viewMode === 'preview' ? (
                    <div className="max-w-4xl mx-auto">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={renderers}>
                            {markdownText || "*No content extracted yet.*"}
                        </ReactMarkdown>
                    </div>
                ) : (
                    <textarea
                        value={markdownText}
                        onChange={(e) => setMarkdownText(e.target.value)}
                        className="w-full min-h-[360px] p-4 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 shadow-sm font-mono text-sm resize-y whitespace-pre-wrap leading-relaxed"
                    />
                )}
            </div>
        </div>
    );
};

export default MarkdownTableEditor;
