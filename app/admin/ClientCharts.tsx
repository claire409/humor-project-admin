'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function ClientCharts({ users, images, captions, votes }: any) {
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const currentMonth = new Date().getMonth();

  const processData = (rawData: any[]) => {
    const buckets: Record<string, number> = {};
    monthNames.forEach(m => buckets[m] = 0);

    rawData.forEach(item => {
      const d = new Date(item.created_datetime_utc);
      if (d.getFullYear() === 2026) {
        buckets[monthNames[d.getMonth()]] += 1;
      }
    });

    return monthNames.map((name, i) => ({
      name,
      count: i > currentMonth ? 0 : buckets[name],
      isFuture: i > currentMonth
    }));
  };

  const ChartBox = ({ title, data, color }: any) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 h-[350px] flex flex-col">
      <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">{title}</h4>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 20, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{fontSize: 10, fontWeight: 800, fill: '#cbd5e1'}}
              padding={{ left: 20, right: 20 }}
            />
            <YAxis
              hide
              domain={[0, (max: number) => Math.max(max, 5)]}
            />
            <Tooltip
               cursor={{fill: '#f8fafc'}}
               contentStyle={{
                 borderRadius: '12px',
                 border: 'none',
                 boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                 fontWeight: 900,
                 fontSize: '10px'
               }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24}>
              {data.map((entry: any, index: number) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isFuture ? '#f1f5f9' : color}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ChartBox title="New Profiles" data={processData(users)} color="#2563eb" />
      <ChartBox title="New Images" data={processData(images)} color="#059669" />
      <ChartBox title="New Captions" data={processData(captions)} color="#ea580c" />
      <ChartBox title="New Votes" data={processData(votes)} color="#db2777" />
    </div>
  );
}