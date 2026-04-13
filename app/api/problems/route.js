import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids') || '';
    const details = searchParams.get('details') === '1';

    const problemIds = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    const problems = await db.problem.findMany({
      where: problemIds.length > 0 ? { id: { in: problemIds } } : undefined,
      select: details
        ? {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            tags: true,
            examples: true,
            constraints: true,
            hints: true,
            editorial: true,
            testCases: true,
            codeSnippets: true,
            referenceSolution: true,
          }
        : {
            id: true,
            title: true,
            difficulty: true,
            tags: true,
          },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, data: problems }, { status: 200 });
  } catch (error) {
    console.log('Error fetching problems for interview modal:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch problems' }, { status: 500 });
  }
}
