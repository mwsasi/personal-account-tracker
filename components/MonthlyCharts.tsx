
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell 
} from 'recharts';

interface MonthlyChartsProps {
  t: any;
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#3b82f6'];

const MonthlyCharts: React.FC<MonthlyChartsProps> = ({ t, transactions }) => {
  const isDark = document.documentElement.classList.contains('dark');

  const categoryData = useMemo(() => {
    const data = [
      { name: t.groceries, value: 0 },
      { name: t.vegetables, value: 0 },
      { name: t.fishEgg, value: 0 },
      { name: t.chicken, value: 0 },
      { name: t.houseRent, value: 0 },
      { name: t.electricity, value: 0 },
      { name: t.water, value: 0 },
      { name: t.travel, value: 0 },
      { name: t.others, value: 0 },
    ];

    transactions.forEach(tx => {
      data[0].value += tx.groceries || 0;
      data[1].value += tx.vegetables || 0;
      data[2].value += tx.fishEgg || 0;
      data[3].value += tx.chicken || 0;
      data[4].value += tx.houseRent || 0;
      data[5].value += tx.electricity || 0;
      data[6].value += tx.water || 0;
      data[7].value += tx.travel || 0;
      data[8].value += tx.others || 0;
    });

    return data.filter(d => d.value > 0);
  }, [transactions, t]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 text-center transition-colors">
        <p className="text-slate-400 dark:text-slate-600">{t.noData}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-6">{t.expensesByCategory}</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke={isDark ? "#64748b" : "#94a3b8"} />
              <YAxis fontSize={12} tickLine={false} axisLine={false} stroke={isDark ? "#64748b" : "#94a3b8"} />
              <Tooltip 
                cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}}
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  borderRadius: '12px', 
                  border: isDark ? '1px solid #1e293b' : 'none', 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-6">{t.expenseDistribution}</h3>
        <div className="h-[300px] flex flex-col items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke={isDark ? "#0f172a" : "#fff"}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#0f172a' : '#ffffff', 
                  borderRadius: '12px', 
                  border: isDark ? '1px solid #1e293b' : 'none',
                  color: isDark ? '#f1f5f9' : '#1e293b'
                }}
              />
              <Legend layout="horizontal" align="center" verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default MonthlyCharts;
