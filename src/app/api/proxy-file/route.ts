import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'SUPERADMIN' && session.user.role !== 'ADMIN' && session.user.role !== 'AUDITOR')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const blob = await response.blob();
        const headers = new Headers();
        headers.set('Content-Type', response.headers.get('Content-Type') || 'application/octet-stream');
        headers.set('Content-Length', response.headers.get('Content-Length') || '');

        return new NextResponse(blob, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
    }
}
