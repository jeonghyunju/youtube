import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const AI_API_KEY = process.env.GEMINI_API_KEY;

// 환경 변수로부터 API Key 인스턴스화 (기존 규격 유지)
const ai = new GoogleGenAI({ apiKey: AI_API_KEY || "" });

export async function POST(request: Request) {
  try {
    // 프론트엔드 탭 메뉴(mode)에 따라 다르게 바인딩할 데이터를 파싱합니다.
    const {
      mode, // 'transform' (자막 변환) 또는 'create' (제품 기반 신규 생성)
      rawScript, // [Tab 1] 원본 자막 데이터
      style, // 공통: 선택된 스타일 칩 ID
      productName, // [Tab 2] 제품/서비스 이름
      productDesc, // [Tab 2] 제품 소구점 설명
    } = await request.json();

    // =================================================================
    // [자막 스크립트 변환] 요청 처리
    // =================================================================
    if (!mode || mode === "transform") {
      if (!rawScript || rawScript.trim() === "") {
        return NextResponse.json(
          { error: "자막 내용을 입력해 주세요." },
          { status: 400 }
        );
      }

      // 페르소나 및 스타일 프롬프트 엔지니어링 (기존 조건 유지 및 확장)
      let stylePrompt = "";
      if (style === "shorts") {
        stylePrompt =
          "1분 이내의 짧고 흡입력 있는 쇼츠/릴스 영상 대본 형태로 각색해줘. 오프닝 훅(Hook)을 강렬하게 짜줘.";
      } else {
        stylePrompt =
          "타임스탬프나 불필요한 추임새를 제거하고, 자연스럽게 이어지는 가독성 높은 유튜브 영상 대본 형태로 정제해줘.";
      }

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

      const aiResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!aiResult || !aiResult.text) {
        return NextResponse.json({ error: "AI가 대본 결과를 반환하지 못했습니다." }, { status: 500 });
      }

      return NextResponse.json({ result: aiResult.text });
    }

    // =================================================================
    // [제품 기반 숏츠 기획 대본] 신규 생성 요청 처리
    // =================================================================
    if (mode === "create") {
      if (!productName || productName.trim() === "") {
        return NextResponse.json(
          { error: "제품명 또는 서비스명을 입력해 주세요." },
          { status: 400 }
        );
      }

      // 사용자가 고른 분위기(style) 칩에 따른 페르소나 미세 조정
      let moodPrompt = "";
      if (style === "funny") {
        moodPrompt = "MZ세대를 겨냥한 유머러스하고 위트 있으며 킹받는 톤앤매너";
      } else if (style === "info") {
        moodPrompt =
          "시청자에게 깊은 신뢰감을 주는 논리적이고 유익한 정보 전달 중심의 톤앤매너";
      } else {
        moodPrompt =
          "감성을 촉촉하게 자극하고 스토리가 중심이 되는 따뜻하고 부드러운 톤앤매너";
      }

      const prompt = `
        너는 조회수 100만 회를 찍는 숏폼(쇼츠, 릴스, 틱톡) 전문 카피라이터이자 크리에이터야.
        제공된 제품 정보를 바탕으로 시청자의 초반 이탈을 막고 구매/조회 욕구를 자극하는 완벽한 '1분 쇼츠 대본 틀'을 새로 작성해줘.

        [제품 정보]
        - 제품/서비스 이름: ${productName}
        - 제품 특징 및 소구점: ${
          productDesc || "대중적인 매력을 가진 혁신 상품"
        }
        - 대본 분위기 및 타겟: ${moodPrompt}

        [대본 필수 구성 조건]
        1. 제목: 조회수를 폭발시킬 수 있는 후킹한 쇼츠 제목 추천 2개
        2. 오프닝 훅 (0~3초): 스크롤을 멈추게 할 강렬하고 자극적인 첫 대사
        3. 본론 (4~50초): 제품의 가장 큰 장점이나 매력을 지루하지 않게 풀어낸 내용
        4. 엔딩 (51~60초): 댓글 작성을 유도하거나 더보기 링크 클릭을 유도하는 멘트(CTA)

        ※ 반드시 [화면 연출 지시사항]과 성우가 읽을 [대사 내용]을 시각적으로 명확히 구분해서 가독성 좋게 출력해줘.
      `;

      const aiResult = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      if (!aiResult || !aiResult.text) {
        return NextResponse.json({ error: "AI가 대본 결과를 반환하지 못했습니다." }, { status: 500 });
      }

      return NextResponse.json({ result: aiResult.text });
    }

    // 예외 가드
    return NextResponse.json(
      { error: "잘못된 접근입니다. 올바른 모드를 선택해 주세요." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Gemini Script Error:", error);
    return NextResponse.json(
      { error: "대본 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
