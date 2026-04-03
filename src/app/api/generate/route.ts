import { NextResponse } from 'next/server';

export const maxDuration = 50; // Set maximum execution time to 50 seconds

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const { server, model, prompt } = await request.json();

  try {
    const response = await fetch(`${server}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Generation failed' }, { status: response.status });
    }

    // Create a transformation stream to process the data
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          // Convert binary data to text
          const text = new TextDecoder().decode(chunk);
          // Split into lines and filter out empty lines
          const lines = text.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              // Attempt to parse each line as JSON
              const data = JSON.parse(line.replace(/^data: /, ''));
              // Only process data that contains a response
              if (data.response) {
                controller.enqueue(encoder.encode(data.response));
              }
              // If it's the last message, other info can be processed
              if (data.done) {
                break;
              }
            } catch (e) {
              // If parsing fails, try to send the content directly
              if (line.includes('response')) {
                const match = line.match(/"response":"([^"]*?)"/);
                if (match && match[1]) {
                  controller.enqueue(encoder.encode(match[1]));
                }
              }
              console.error('Error processing data block:', e);
              continue;
            }
          }
        } catch (error) {
          console.error('Error processing data block:', error);
        }
      }
    });

    // Process the response through the transformation stream
    const readableStream = response.body?.pipeThrough(transformStream);
    if (!readableStream) {
      return NextResponse.json({ error: 'No response body' }, { status: 500 });
    }

    return new Response(readableStream);
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
 