"use client";

import {
    LineChart,
    Line,
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
            {/* Growth Chart */}
            <div style={{
                backgroundColor: 'var(--card-bg)',
                padding: '1.5rem',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--border-color)'
            }}>
                <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>Inscripciones Nuevas</h3>
                <div style={{ height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={growthData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                            <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    boxShadow: 'var(--shadow-md)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="var(--uflp-blue)"
                                strokeWidth={3}
                                dot={{ fill: 'var(--uflp-blue)', strokeWidth: 2 }}
                                activeDot={{ r: 8 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Distribution Charts Container */}
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '2rem' }}>
                {/* Payments */}
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>Estado de Pagos</h3>
                    <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{
                                    backgroundColor: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)'
                                }} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" formatter={(value) => <span style={{ color: 'var(--text-primary)' }}>{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Documents */}
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--border-color)'
                }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)', fontSize: '1.2rem' }}>Estado de Documentos</h3>
                    <div style={{ height: '200px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={documentData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {documentData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{
                                    backgroundColor: 'var(--card-bg)',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-primary)'
                                }} />
                                <Legend verticalAlign="middle" align="right" layout="vertical" formatter={(value) => <span style={{ color: 'var(--text-primary)' }}>{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
