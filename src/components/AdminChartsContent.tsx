"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';

interface AdminChartsContentProps {
    growthData: { date: string; count: number }[];
    paymentData: { name: string; value: number; color: string }[];
    documentData: { name: string; value: number; color: string }[];
}

export default function AdminChartsContent({ growthData, paymentData, documentData }: AdminChartsContentProps) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Growth Chart */}
            <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                backdropFilter: 'blur(12px)',
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>Inscripciones Nuevas</h3>
                    <span style={{ fontSize: '0.75rem', color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600 }}>Últimos 6 meses</span>
                </div>
                <div style={{ height: '280px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={growthData}>
                            <defs>
                                <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35}/>
                                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.06)" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                    color: '#f8fafc',
                                    fontWeight: 600
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#38bdf8"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#growthGradient)"
                                dot={{ fill: '#38bdf8', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 7, stroke: '#ffffff', strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribution Charts Container */}
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '1.5rem' }}>
                {/* Payments */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(12px)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                    <h3 style={{ marginBottom: '0.75rem', color: '#f8fafc', fontSize: '1rem', fontWeight: 700 }}>Distribución de Pagos</h3>
                    <div style={{ height: '150px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    color: '#f8fafc'
                                }} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 500 }}>{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Documents */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    backdropFilter: 'blur(12px)',
                    padding: '1.25rem 1.5rem',
                    borderRadius: '16px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                    <h3 style={{ marginBottom: '0.75rem', color: '#f8fafc', fontSize: '1rem', fontWeight: 700 }}>Estado de Documentación</h3>
                    <div style={{ height: '150px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={documentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {documentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{
                                    backgroundColor: '#0f172a',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    color: '#f8fafc'
                                }} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" formatter={(value) => <span style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 500 }}>{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
