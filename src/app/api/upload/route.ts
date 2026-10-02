import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES } from '@/lib/image-upload';

/**
 * Issues short-lived Vercel Blob client tokens for event images. The browser
 * uploads straight to Blob storage with the token (the file never passes
 * through this server); the token restricts what can be uploaded and where.
 *
 * The returned blob URL is saved through the normal event endpoints, so no
 * onUploadCompleted callback is needed.
 */

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Only people who can create or edit events may upload.
        const session = await auth();
        const roles = session?.user?.roles ?? [];
        if (!session?.user || !(roles.includes('Organizer') || roles.includes('Admin'))) {
          throw new Error('Only organizers can upload event images.');
        }
        if (!pathname.startsWith('events/') || pathname.includes('..')) {
          throw new Error('Invalid upload path.');
        }

        return {
          allowedContentTypes: IMAGE_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true, // never overwrite someone else's image
          tokenPayload: JSON.stringify({ userId: session.user.id }),
        };
      },
    });

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed.' },
      { status: 400 },
    );
  }
}
