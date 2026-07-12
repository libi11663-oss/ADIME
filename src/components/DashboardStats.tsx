import { Submission } from "../types";
import { FileText, Clock, CheckCircle, XCircle, Award } from "lucide-react";

interface DashboardStatsProps {
  submissions: Submission[];
}

export default function DashboardStats({ submissions }: DashboardStatsProps) {
  const total = submissions.length;
  const pending = submissions.filter((s) => s.status === "pending").length;
  const approved = submissions.filter((s) => s.status === "approved").length;
  const rejected = submissions.filter((s) => s.status === "rejected").length;
  
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {/* Total Submissions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3 hover:border-indigo-200 transition-colors duration-200">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <FileText size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">總申請名單</p>
          <p className="text-2xl font-black text-slate-900">{total}</p>
        </div>
      </div>

      {/* Pending */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3 hover:border-amber-200 transition-colors duration-200">
        <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
          <Clock size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">待審核</p>
          <p className="text-2xl font-black text-slate-900">
            {pending}
            {pending > 0 && (
              <span className="ml-1.5 inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            )}
          </p>
        </div>
      </div>

      {/* Approved */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3 hover:border-emerald-200 transition-colors duration-200">
        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
          <CheckCircle size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">已同意</p>
          <p className="text-2xl font-black text-slate-900">{approved}</p>
        </div>
      </div>

      {/* Rejected */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-3 hover:border-rose-200 transition-colors duration-200">
        <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
          <XCircle size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">已拒絕</p>
          <p className="text-2xl font-black text-slate-900">{rejected}</p>
        </div>
      </div>

      {/* Conversion Rate */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 col-span-2 md:col-span-1 flex items-center space-x-3 hover:border-indigo-200 transition-colors duration-200">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <Award size={20} />
        </div>
        <div className="w-full">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">審核通過率</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900">{approvalRate}%</span>
            <span className="text-2xs text-slate-400 font-bold">({approved}/{total})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
