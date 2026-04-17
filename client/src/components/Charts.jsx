import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export function WeeklyVolumeChart({ weeklyVolume }) {
  const data = Object.entries(weeklyVolume || {}).map(([week, volume]) => ({ week, volume }));
  return (
    <div className="h-52 rounded-2xl border border-white/10 bg-black/35 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="week" tick={{ fill: "#bbb", fontSize: 10 }} />
          <YAxis tick={{ fill: "#bbb", fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="volume" fill="#8b5cf6" animationDuration={700} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StrengthChart({ points }) {
  return (
    <div className="h-52 rounded-2xl border border-white/10 bg-black/35 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points || []}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="date" tick={{ fill: "#bbb", fontSize: 10 }} />
          <YAxis tick={{ fill: "#bbb", fontSize: 10 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="#34d399"
            strokeWidth={2}
            dot={false}
            animationDuration={750}
            animationEasing="ease-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
