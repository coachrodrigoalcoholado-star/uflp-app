'use client';

import { useState, useEffect } from 'react';
// import * as XLSX from 'xlsx'; // Removed for dynamic import

export default function DatabaseReportPage() {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        // Search in Name, Paternal, Maternal columns specifically as requested, plus general fallback
        const namePart = (item["Nombre(s)"] || '').toLowerCase();
        const paternoPart = (item["Apellido Paterno"] || '').toLowerCase();
        const maternoPart = (item["Apellido Materno"] || '').toLowerCase();

        return namePart.includes(searchLower) ||
            paternoPart.includes(searchLower) ||
            maternoPart.includes(searchLower);
    });

    const fetchData = async () => {
        try {
            const res = await fetch('/api/admin/reports/db');
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const downloadExcel = async () => {
        try {
            const xlsxModule = await import('xlsx');
            const XLSX = xlsxModule.default || xlsxModule;
            const worksheet = XLSX.utils.json_to_sheet(data);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Base de Datos Alumnos");

            const wscols = Object.keys(data[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, `Base_Datos_Alumnos_UFLP_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (error) {
            console.error("Error downloading Excel:", error);
            alert("Hubo un error al generar el archivo Excel. Por favor intente nuevamente.");
        }
    };

    if (loading) return <div style={{ padding: '2rem' }}>Cargando base de datos...</div>;

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.8rem', color: '#1e3a8a', margin: 0 }}>Base de Datos de Alumnos</h1>
                    <button
                        onClick={downloadExcel}
                        style={{
                            backgroundColor: '#166534',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    >
                        <span>📊</span> Descargar Excel
                    </button>
                    <div style={{ marginLeft: 'auto', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o apellido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '8px 10px 8px 35px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                fontSize: '0.9rem',
                                width: '300px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>
                <p style={{ color: '#64748b', marginTop: 0 }}>Vista completa de perfiles de alumnos registrados</p>
            </div>

            <div style={{
                width: '100%',
                overflow: 'auto',
                height: 'calc(100vh - 220px)', // Fixed height to ensure scroll container
                maxHeight: 'calc(100vh - 220px)',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: '1px solid #e2e8f0',
                position: 'relative' // For sticky header context
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '2400px' }}>
                    <thead style={{ backgroundColor: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                            {data.length > 0 && Object.keys(data[0]).map((header) => (
                                <th key={header} style={{
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontWeight: '600',
                                    color: '#475569',
                                    borderBottom: '2px solid #e2e8f0',
                                    backgroundColor: '#f8fafc', // Sticky header needs background
                                    whiteSpace: 'nowrap'
                                }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((row, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: index % 2 === 0 ? 'white' : '#f8fafc' }}>
                                {Object.values(row).map((value: any, idx) => (
                                    <td key={idx} style={{
                                        padding: '10px 16px',
                                        color: '#334155',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '300px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {value}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredData.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                        {data.length === 0 ? 'No hay alumnos registrados.' : 'No se encontraron resultados.'}
                    </div>
                )}
            </div>
            <div style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                Total de registros: {filteredData.length}
            </div>
        </div>
    );
}
