import { useState } from 'react';
import { CheckCircle, Code, Copy, Database, Download, FileText, Terminal, X } from 'lucide-react';
import { downloadDatabaseSetupZip } from '../services/projectExporter';

interface JavaArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const sourceFiles = [
  {
    name: 'DBConnectionUtil.java',
    path: 'backend/java/src/main/java/com/skillbridge/util/DBConnectionUtil.java',
    purpose: 'Initializes the HikariCP pool from MYSQL_* environment variables.',
  },
  {
    name: 'ApiFilter.java',
    path: 'backend/java/src/main/java/com/skillbridge/servlet/ApiFilter.java',
    purpose: 'Enforces signed-in sessions and API role requirements.',
  },
  {
    name: 'AuthServlet.java',
    path: 'backend/java/src/main/java/com/skillbridge/servlet/AuthServlet.java',
    purpose: 'Registers accounts, verifies BCrypt passwords, and manages sessions.',
  },
  {
    name: 'BookingDAO.java',
    path: 'backend/java/src/main/java/com/skillbridge/dao/BookingDAO.java',
    purpose: 'Persists booking transitions, notifications, attachments, and unpaid invoices.',
  },
  {
    name: 'QuotationDAO.java',
    path: 'backend/java/src/main/java/com/skillbridge/dao/QuotationDAO.java',
    purpose: 'Creates and accepts quotations in validated JDBC transactions.',
  },
  {
    name: 'schema.sql',
    path: 'backend/database/schema.sql',
    purpose: 'Defines the canonical, non-destructive onestop_db schema.',
  },
  {
    name: 'pom.xml',
    path: 'backend/java/pom.xml',
    purpose: 'Builds the Jakarta Servlet WAR for Apache Tomcat 10.1.',
  },
] as const;

export default function JavaArchitectureModal({ isOpen, onClose }: JavaArchitectureModalProps) {
  const [activeFile, setActiveFile] = useState<(typeof sourceFiles)[number]>(sourceFiles[3]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.path);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Unable to copy the source path. Check browser clipboard permissions.');
    }
  };

  const downloadSetup = async () => {
    setError('');
    setDownloading(true);
    try {
      await downloadDatabaseSetupZip();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The database setup archive could not be created.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#102B25] text-stone-100 rounded-3xl max-w-5xl w-full h-[85vh] flex flex-col shadow-2xl border border-[#D6B779]/30 overflow-hidden my-6"
        onClick={event => event.stopPropagation()}
      >
        <div className="p-4 px-6 bg-[#0B1E19] border-b border-[#D6B779]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#173D32] border border-[#D6B779]/40 flex items-center justify-center text-[#D6B779]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-brand text-white tracking-wide">
                Core Java + JDBC Architecture Explorer
              </h2>
              <p className="text-[11px] text-stone-400">
                React + Vite · Java Servlets · JDBC · MySQL · Apache Tomcat 10.1
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copyPath}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono-code transition-colors"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D6B779]" />}
              <span>{copied ? 'Copied' : 'Copy Source Path'}</span>
            </button>
            <button
              onClick={downloadSetup}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#D6B779] hover:bg-[#c4a465] text-[#102B25] text-xs font-bold font-mono-code transition-colors shadow-sm disabled:opacity-60"
              title="Download the MySQL schema and demo seed data"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Preparing...' : 'Download DB Setup ZIP'}</span>
            </button>
            <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-72 shrink-0 bg-[#0B1E19]/60 border-r border-white/10 p-3 space-y-1 overflow-y-auto text-xs font-mono-code">
            <div className="text-[10px] uppercase font-bold text-stone-500 px-2 py-1 tracking-wider">
              Active project source
            </div>
            {sourceFiles.map(file => (
              <button
                key={file.name}
                onClick={() => setActiveFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  activeFile.name === file.name
                    ? 'bg-[#173D32] text-[#D6B779] font-bold border border-[#D6B779]/30'
                    : 'text-stone-400 hover:bg-white/5 hover:text-stone-200'
                }`}
              >
                {file.name.endsWith('.sql')
                  ? <FileText className="w-3.5 h-3.5 text-[#D6B779]" />
                  : <Code className="w-3.5 h-3.5 text-[#D6B779]" />}
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 bg-[#071310] overflow-y-auto text-stone-300">
            <div className="text-xs uppercase tracking-wider text-[#D6B779] mb-2">Current repository file</div>
            <h3 className="text-lg font-semibold text-white font-mono-code mb-4">{activeFile.name}</h3>
            <code className="block rounded-xl bg-white/5 border border-white/10 p-4 text-xs text-emerald-200 break-all">
              {activeFile.path}
            </code>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-stone-300">{activeFile.purpose}</p>
            <p className="mt-6 max-w-2xl text-xs leading-5 text-stone-500">
              This explorer points to the live project files instead of displaying or exporting duplicate sample code.
              The database setup archive contains only the schema and demo seed data; backend source remains in this repository.
            </p>
            {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
          </div>
        </div>

        <div className="p-3 px-6 bg-[#0B1E19] border-t border-white/10 flex items-center justify-between text-xs text-stone-400 font-mono-code">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#D6B779]" />
            <span>Target container: Apache Tomcat 10.1 · Database: MySQL onestop_db</span>
          </div>
          <span className="text-[#D6B779]">REST APIs · JDBC prepared statements</span>
        </div>
      </div>
    </div>
  );
}
