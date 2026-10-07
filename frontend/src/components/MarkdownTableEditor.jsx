import React from 'react';

const MarkdownTableEditor = ({ markdownText, setMarkdownText }) => {
    // If it doesn't look like a markdown table, just show a textarea
    if (!markdownText.includes('| ---')) {
        return (
            <textarea
                value={markdownText}
                onChange={(e) => setMarkdownText(e.target.value)}
                className="w-full min-h-[400px] p-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-800 shadow-sm font-mono text-sm resize-y whitespace-pre-wrap"
            />
        );
    }

    const lines = markdownText.trim().split('\n');
    const tableLines = lines.filter(l => l.trim().startsWith('|'));
    const nonTableLines = lines.filter(l => !l.trim().startsWith('|')).join('\n');

    if (tableLines.length < 2) return <textarea value={markdownText} onChange={e => setMarkdownText(e.target.value)} className="w-full min-h-[400px] p-3 border border-gray-300 rounded-lg bg-gray-50" />;

    const headers = tableLines[0].split('|').slice(1, -1).map(s => s.trim());
    const rows = tableLines.slice(2).map(row => row.split('|').slice(1, -1).map(s => s.trim()));

    const handleCellChange = (rowIndex, colIndex, newValue) => {
        const newRows = [...rows];
        newRows[rowIndex][colIndex] = newValue.replace(/\|/g, '-').replace(/\n/g, '<br>');
        
        // Rebuild markdown
        let newMd = nonTableLines + (nonTableLines ? '\n\n' : '');
        newMd += '| ' + headers.join(' | ') + ' |\n';
        newMd += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
        newRows.forEach(r => {
            newMd += '| ' + r.join(' | ') + ' |\n';
        });
        
        setMarkdownText(newMd);
    };

    return (
        <div className="overflow-x-auto w-full border border-gray-300 rounded-lg bg-white">
            <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-white uppercase bg-cyan-600">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 border-b border-r border-cyan-700">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b hover:bg-gray-50">
                            {row.map((cell, cIdx) => (
                                <td key={cIdx} className="px-2 py-2 border-r border-gray-200 align-top">
                                    <textarea
                                        value={cell.replace(/<br>/g, '\n')}
                                        onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                        className="w-full min-h-[60px] p-1 bg-transparent focus:bg-white focus:ring-1 focus:ring-cyan-500 border-transparent resize-y"
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MarkdownTableEditor;
