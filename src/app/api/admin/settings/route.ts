
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdminView, requireSuperAdmin } from '@/lib/adminAuth';

export async function GET() {
    try {
        await requireAdminView();

        const settings = await prisma.systemSetting.findMany();

        const settingsMap: Record<string, string> = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        return NextResponse.json({ settings: settingsMap });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        await requireSuperAdmin();

        const body = await request.json();
        const { key, value, description } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
        }

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value: String(value), description },
            create: { key, value: String(value), description },
        });

        return NextResponse.json({ setting });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
