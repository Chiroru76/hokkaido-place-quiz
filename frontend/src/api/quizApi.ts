const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
const BASE_URL = `${API_BASE_URL}/api/v1`;

// POST /api/v1/sessions
export async function startSession(total: number) {
    const response = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ total }),
    });

    if (!response.ok) {
        throw new Error('セッション開始に失敗しました');
    }

    return response.json();
}
// GET /api/v1/questions/next
export async function fetchNextQuestion(sessionId: string) {
    const response = await fetch(`${BASE_URL}/questions/next?session_id=${sessionId}`);

    if (!response.ok) {
        throw new Error('問題の取得に失敗しました');
    }

    return response.json();
}

//  POST /api/v1/questions/:id/answer
export async function submitAnswer(sessionId: string, questionId: number, answer: string) {
    const response = await fetch(`${BASE_URL}/questions/${questionId}/answer`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ session_id: sessionId, answer }),
        }
    );

    if (!response.ok) {
        throw new Error('回答の送信に失敗しました');
    }

    return response.json();
}
