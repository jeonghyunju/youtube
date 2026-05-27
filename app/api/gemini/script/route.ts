import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai"; // 설치하신 구글 공식 gemini 라이브러리에 맞게 import 하세요.

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { rawScript, style } = await request.json();

    if (!rawScript || rawScript.trim() === "") {
      return NextResponse.json(
        { error: "자막 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    // 페르소나 및 스타일 프롬프트 엔지니어링
    let stylePrompt = "";
    if (style === "shorts") {
      stylePrompt =
        "1분 이내의 짧고 흡입력 있는 쇼츠/릴스 영상 대본 형태로 각색해줘. 오프닝 훅(Hook)을 강렬하게 짜줘.";
    } else if (style === "blog") {
      stylePrompt =
        "독자가 읽기 편한 깔끔한 블로그 포스팅용 줄글 형태로 정돈해주고, 핵심 요약 3가지를 상단에 포함해줘.";
    } else {
      stylePrompt =
        "타임스탬프나 불필요한 추임새를 제거하고, 자연스럽게 이어지는 가독성 높은 유튜브 영상 대본 형태로 정제해줘.";
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
            너는 유튜브 영상 대본 전문 작가이자 카피라이터야. 
        아래 제공된 유튜브 원본 자막 데이터(무맥락 문장이나 타임스탬프가 포함되어 있을 수 있음)를 가공해서 클라이언트가 바로 사용할 수 있는 훌륭한 대본을 만들어줘.

        [요구사항]
        - ${stylePrompt}
        - 비속어나 맞춤법이 틀린 부분은 자연스럽게 교정해줘.
        - 원본의 핵심 주제와 뉘앙스는 그대로 유지해야 해.

        [원본 자막]
        ${rawScript}
        `;

    const aiResult = await model.generateContent(prompt);

    return NextResponse.json({ result: aiResult.response.text });
  } catch (error) {
    console.error("Gemini Script Error:", error);
    return NextResponse.json(
      { error: "대본 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
