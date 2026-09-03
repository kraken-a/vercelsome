import {NextRequest, NextResponse} from 'next/server';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const res = await fetch(`https://api.tecnibo.com/pricing/${body.name}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body.body),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
        return NextResponse.json({error: data ?? 'Pricing request failed'}, {status: res.status});
    }
    return NextResponse.json(data);
}