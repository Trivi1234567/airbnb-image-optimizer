import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate Airbnb URL
    if (!url.includes('airbnb.com/rooms/')) {
      return NextResponse.json(
        { error: 'Please enter a valid Airbnb listing URL' },
        { status: 400 }
      );
    }

    // For now, return a simple response
    // In a real implementation, this would start the optimization process
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      jobId,
      status: 'pending',
      message: 'Optimization job created successfully',
      url: url
    });

  } catch (error) {
    console.error('Optimization request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
