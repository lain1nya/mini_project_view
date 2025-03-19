import React, { useEffect, useState } from "react";
import "./App.css";

interface ReceiptItem {
  nagging: string;
  category: string;
  liked: boolean | null;
  amount?: number;
  reason?: string;
  price?: string;
  explanation?: string;
}

interface NaggingItem {
  nagging: string;
  price: number;
}

const App = () => {
  const [naggingInput, setNaggingInput] = useState("");
  const [isShow, setIsShow] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptItem>();
  const [receiptList, setReceiptList] = useState<ReceiptItem[]>([]);
  const [isDisliked, setIsDisliked] = useState(false);
  const [dislikeAmount, setDislikeAmount] = useState<number | null>(null);
  const [dislikeReason, setDislikeReason] = useState("");
  const [loading, setLoading] = useState(false);

  const [naggingList, setNaggingList] = useState<NaggingItem[]>([]);

  useEffect(() => {
    const storedNagging = JSON.parse(
      sessionStorage.getItem("naggingList") || "[]"
    );
    setNaggingList(storedNagging);
  }, []);

  useEffect(() => {}, [naggingList]);

  const handleNaggingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNaggingInput(e.target.value);
  };

  const handleSubmitNagging = async () => {
    if (!naggingInput) {
      alert("잔소리를 입력해주세요");
      return;
    }
    setLoading(true);

    try {
      const response = await fetch("http://localhost:8000/get_price/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ remark: naggingInput }),
      });

      const data = await response.json();
      const result = data.result;

      const newReceipt: ReceiptItem = {
        nagging: result.remark,
        category: result.category,
        liked: null,
        price: result.suggested_price,
        explanation: result.explanation,
      };

      setReceipt(newReceipt);
      setReceiptList([...receiptList, newReceipt]);
      setIsShow(true);

      const existingNagging = JSON.parse(
        sessionStorage.getItem("naggingList") || "[]"
      );

      const updateNagging = [...existingNagging, newReceipt];
      sessionStorage.setItem("naggingList", JSON.stringify(updateNagging));
      setNaggingList(updateNagging);
    } catch (error) {
      console.error("Error fetching price: ", error);
    }

    setLoading(false);
    setNaggingInput("");
    setIsDisliked(false);
    setDislikeAmount(null);
    setDislikeReason("");
  };

  // 가격 좋아요 싫어요 버튼
  const handleLikeDislike = async (isLike: boolean) => {
    if (!receipt) return;
    if (isLike) {
      setIsShow(false);
    } else {
      setIsDisliked(true);
    }
    try {
      const response = await fetch("http://localhost:8000/feedback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remark: receipt.nagging,
          category: receipt.category,
          is_positive: isLike,
        }),
      });

      const data = await response.json();
      console.log("Response", data);
      alert("성공적으로 제출되었습니다.");
    } catch (error) {
      console.error("Error submitting feedback: ", error);
      alert("피드백 제출이 실패했습니다.");
    }
  };

  const handleSubmitFeedback = async () => {
    if (!receipt || !dislikeAmount) {
      alert("가격을 입력해주세요.");
      return;
    }
    try {
      const response = await fetch("http://localhost:8000/suggest-price/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remark: receipt.nagging,
          suggested_price: dislikeAmount,
          reason: dislikeReason,
        }),
      });
      const data = await response.json();
      setIsShow(false);
      console.log("Feedback Response", data);
      alert("성공적으로 제출되었습니다.");
    } catch (error) {
      alert("피드백 제출이 실패했습니다.");
      console.error("Error submitting feedback: ", error);
    }
  };

  const handleDislikeAmountChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
  ) => {
    setDislikeAmount(Number(e.target.value));
  };

  const handleDislikeReasonChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDislikeReason(e.target.value);
  };

  return (
    <div className="app">
      <h1>명절 잔소리 영수증</h1>
      <section className="total-section">
        <section className="input-section">
          <label className="input-label" htmlFor="nagging">
            💬 잔소리를 입력하세요:
          </label>
          <input
            id="nagging"
            type="text"
            value={naggingInput}
            onChange={handleNaggingChange}
            placeholder="잔소리를 입력해주세요"
          />
          <button onClick={handleSubmitNagging} disabled={loading}>
            {loading ? "⏳ 가격 계산 중..." : "💰 가격 측정하기"}
          </button>
          {/* Like & Dislike Section */}
          {isShow && receipt && (
            <div className="analysis-done">
              분석이 완료되었습니다. 해당 가격이 어떤지 알려주세요.
            </div>
          )}
          {isShow && receipt && (
            <section className="receipt">
              <div className="receipt-content">
                <div className="receipt-item">
                  <span className="receipt-label">📢 입력한 잔소리</span>
                  <span className="receipt-value">{receipt.nagging}</span>
                </div>
                <div className="receipt-item">
                  <span className="receipt-label">💰 예상 가격</span>
                  <span className="receipt-value">{receipt.price}만원</span>
                </div>
                <div className="receipt-item">
                  <span className="receipt-label">📖 설명</span>
                  <span className="receipt-value">{receipt.explanation}</span>
                </div>
              </div>
              <div>💭 이 가격에 대해 어떻게 생각하시나요?</div>
              <div className="receipt-button">
                <button onClick={() => handleLikeDislike(true)}>
                  👍 좋아요
                </button>
                <button onClick={() => handleLikeDislike(false)}>
                  👎 나빠요
                </button>
              </div>
              {isDisliked && (
                <div className="memo-container">
                  <div className="memo-header">
                    <span className="memo-icon">📝</span>
                    <span className="memo-title">나의 의견 메모</span>
                  </div>
                  <div className="memo-content">
                    <div className="memo-question">
                      💭 그럼 얼마가 적당하다고 생각하시나요? 이유도 함께
                      설명해주세요.
                    </div>
                    <div className="memo-input-group">
                      <select
                        className="memo-select"
                        onChange={handleDislikeAmountChange}
                        value={dislikeAmount ?? ""}
                      >
                        <option value="" disabled>
                          금액 선택 (만원)
                        </option>
                        {Array.from({ length: 15 }, (_, i) => i + 1).map(
                          (num) => (
                            <option key={num} value={num}>
                              {num} 만원
                            </option>
                          )
                        )}
                      </select>
                      <input
                        className="memo-text-input"
                        type="text"
                        placeholder="이유를 작성해주세요(선택)"
                        onChange={handleDislikeReasonChange}
                        value={dislikeReason}
                      />
                    </div>
                    <div className="memo-submit">
                      <button onClick={handleSubmitFeedback}>
                        💡 의견 제출하기
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </section>
        {/* 영수증 리스트 출력 */}
        <section className="view-section">
          <h2>Invoice</h2>
          <div className="receipt-section">
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>잔소리</th>
                  <th>제안한 가격 (만원)</th>
                </tr>
              </thead>
              <tbody>
                {naggingList.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="empty-message">
                      저장된 영수증이 없습니다.
                    </td>
                  </tr>
                ) : (
                  naggingList.map((nagging, index) => (
                    <tr key={index}>
                      <td>{nagging.nagging}</td>
                      <td>{nagging.price}만원</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="receipt-summary">
              <div className="summary-item total">
                <span>Total</span>
                <span>
                  {naggingList.reduce(
                    (sum, f) => sum + (parseInt(f.price) || 0),
                    0
                  )}{" "}
                  만원
                </span>
              </div>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
};

export default App;
