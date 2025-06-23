import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!address) {
    return NextResponse.json(
      { error: 'Missing address parameter' },
      { status: 400 }
    );
  }

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Maps API key is not configured' },
      { status: 500 }
    );
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: data.error_message || 'Error fetching geocode data' },
        { status: 500 }
      );
    }

    return NextResponse.json(data.results[0]);
  } catch (error) {
    console.error('Error fetching from Google Geocode API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geocode data' },
      { status: 500 }
    );
  }
} 