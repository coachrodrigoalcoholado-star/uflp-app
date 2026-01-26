// @ts-nocheck
import { NextResponse } from 'next/server';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json(
        { error: 'Cohort management temporarily disabled' },
        { status: 503 }
    );
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    return NextResponse.json(
        { error: 'Cohort management temporarily disabled' },
        { status: 503 }
    );
}
