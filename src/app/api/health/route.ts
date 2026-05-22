import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Ejecutamos una consulta simple para simular actividad en la base de datos de Supabase
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'diploma_total_cost' }
        });
        
        return NextResponse.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            dbActive: !!setting
        });
    } catch (error: any) {
        console.error('Health check failed:', error);
        return NextResponse.json({ 
            status: 'unhealthy', 
            error: error.message 
        }, { status: 500 });
    }
}

export async function HEAD() {
    try {
        // También consultamos la base de datos en peticiones HEAD para registrar actividad
        await prisma.systemSetting.findUnique({
            where: { key: 'diploma_total_cost' }
        });
        
        return new Response(null, {
            status: 200,
            headers: {
                'x-status': 'healthy'
            }
        });
    } catch (error: any) {
        console.error('Health check HEAD failed:', error);
        return new Response(null, {
            status: 500
        });
    }
}
