"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  formatPriceInput,
  parsePriceInput,
  formatPhoneNumber,
} from "@/lib/utils";
import {
  Upload,
  X,
  Plus,
  AlertCircle,
  CheckCircle,
  Camera,
  Video,
} from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "IMAGE" | "VIDEO";
}

export default function SellPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  // Refs for focusing on empty fields
  const titleRef = useRef<HTMLInputElement>(null!);
  const speciesRef = useRef<HTMLSelectElement>(null!);
  const startPriceRef = useRef<HTMLInputElement>(null!);
  const bidStepRef = useRef<HTMLInputElement>(null!);
  const startsAtRef = useRef<HTMLInputElement>(null!);
  const endsAtRef = useRef<HTMLInputElement>(null!);
  const shippingMethodRef = useRef<HTMLSelectElement>(null!);

  const [formData, setFormData] = useState(() => {
    // 현재 날짜와 시간 설정
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // datetime-local 형식으로 변환 (YYYY-MM-DDTHH:MM)
    const formatDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    return {
      // 기본 정보
      title: "",
      description: "",
      species: "",
      style: "",
      sizeClass: "",
      heightCm: "",
      crownWidthCm: "",
      trunkDiameterCm: "",
      ageYearsEst: "",
      healthNotes: "",
      originNotes: "",
      careHistory: "",

      // 경매 설정
      startPrice: "",
      buyNowPrice: "",
      reservePrice: "",
      bidStep: "",
      startsAt: formatDateTime(now),
      endsAt: formatDateTime(tomorrow),
      autoExtendMinutes: "",

      // 배송 정보
      shippingMethod: "COURIER",
      shippingFeePolicy: "",
      packagingNotes: "",
    };
  });

  // 사용자가 없으면 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 각 단계별 유효성 검사 함수
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // 기본 정보
        return !!(formData.title && formData.species);
      case 2: // 경매 설정
        const hasRequiredFields = !!(
          formData.startPrice &&
          formData.bidStep &&
          formData.startsAt &&
          formData.endsAt
        );

        // 시작 시간이 종료 시간보다 빠른지 확인
        const startTime = new Date(formData.startsAt);
        const endTime = new Date(formData.endsAt);
        const isValidTimeRange = startTime < endTime;

        return hasRequiredFields && isValidTimeRange;
      case 3: // 배송 정보
        return !!(formData.shippingMethod);
      case 4: // 미디어 (선택사항)
        return true; // 미디어는 선택사항
      default:
        return false;
    }
  };

  // 다음 단계로 이동하는 함수
  const goToNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(4, currentStep + 1));
      setError(""); // 오류 메시지 초기화
    } else {
      // 필수 필드가 누락된 경우 오류 메시지 표시 및 첫 번째 빈 필드에 포커스
      const missingFields: string[] = [];
      let firstEmptyFieldRef: React.RefObject<HTMLInputElement | HTMLSelectElement> | undefined = undefined;

      if (currentStep === 1) {
        if (!formData.title) {
          missingFields.push("상품명");
          if (!firstEmptyFieldRef) firstEmptyFieldRef = titleRef;
        }
        if (!formData.species) {
          missingFields.push("수종");
          if (!firstEmptyFieldRef) firstEmptyFieldRef = speciesRef;
        }
      } else if (currentStep === 2) {
        if (!formData.startPrice) {
          missingFields.push("시작 가격");
          if (!firstEmptyFieldRef) firstEmptyFieldRef = startPriceRef;
        }
        if (!formData.bidStep) {
          missingFields.push("입찰 단위");
          if (!firstEmptyFieldRef) firstEmptyFieldRef = bidStepRef;
        }
        if (!formData.startsAt) {
          missingFields.push("경매 시작 시간");
          if (!firstEmptyFieldRef) firstEmptyFieldRef = startsAtRef;
        }
        if (!formData.endsAt) {
          missingFields.push("경매 종료 시간");
          if (!firstEmptyFieldRef) firstEmptyFieldRef = endsAtRef;
        }

        // 시간 유효성 검사
        if (formData.startsAt && formData.endsAt) {
          const startTime = new Date(formData.startsAt);
          const endTime = new Date(formData.endsAt);
          if (startTime >= endTime) {
            missingFields.push("올바른 경매 기간 (종료 시간이 시작 시간보다 늦어야 함)");
            if (!firstEmptyFieldRef) firstEmptyFieldRef = endsAtRef;
          }
        }
      } else if (currentStep === 3) {
        if (!formData.shippingMethod) {
          missingFields.push("배송 방법");
          if (!firstEmptyFieldRef) firstEmptyFieldRef = shippingMethodRef;
        }
      }

      // 첫 번째 빈 필드에 포커스
      if (firstEmptyFieldRef && firstEmptyFieldRef.current) {
        firstEmptyFieldRef.current.focus();
        firstEmptyFieldRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }

      setError(`다음 필수 항목을 입력해주세요: ${missingFields.join(", ")}`);
    }
  };

  // 로딩 중이면 로딩 화면 표시
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 사용자가 없으면 로딩 화면 표시 (리다이렉트 중)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 페이지로 이동 중...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 입력 시 오류 메시지 초기화 (해당 단계의 유효성 검사를 통과한 경우)
    if (error) {
      setTimeout(() => {
        if (validateStep(currentStep)) {
          setError("");
        }
      }, 100);
    }
  };

  // 가격 입력 핸들러
  const handlePriceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatPriceInput(value);
    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  // 빠른 가격 설정 핸들러 (현재 가격에 추가)
  const handleQuickPrice = (fieldName: string, amount: number) => {
    setFormData((prev) => {
      const currentValue = prev[fieldName as keyof typeof prev] as string;
      // 현재 가격에서 숫자만 추출 (쉼표 제거)
      const currentAmount = currentValue ? parsePriceInput(currentValue) : 0;
      // 새로운 금액은 현재 금액 + 버튼 금액
      const newAmount = currentAmount + amount;
      const formattedValue = formatPriceInput(newAmount.toString());
      
      return {
        ...prev,
        [fieldName]: formattedValue,
      };
    });
  };

  // 전화번호 입력 핸들러
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedValue = formatPhoneNumber(value);
    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        // 10MB 제한
        alert("파일 크기는 10MB를 초과할 수 없습니다.");
        return;
      }

      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
      };

      setMediaFiles((prev) => [...prev, mediaFile]);
    });
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/")
    );

    if (validFiles.length === 0) {
      setError("이미지 또는 동영상 파일만 업로드할 수 있습니다.");
      return;
    }

    if (mediaFiles.length + validFiles.length > 10) {
      setError("최대 10개의 파일만 업로드할 수 있습니다.");
      return;
    }

    validFiles.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        setError("파일 크기는 10MB 이하여야 합니다.");
        return;
      }

      const mediaFile: MediaFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("video/") ? "VIDEO" : "IMAGE",
      };

      setMediaFiles((prev) => [...prev, mediaFile]);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // FormData 생성
      const submitData = new FormData();

      // 기본 정보 (가격 필드는 파싱된 값으로 전송)
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          if (
            ["startPrice", "buyNowPrice", "reservePrice", "bidStep"].includes(
              key
            )
          ) {
            submitData.append(key, parsePriceInput(value).toString());
          } else {
            submitData.append(key, value);
          }
        }
      });

      // 미디어 파일 추가
      mediaFiles.forEach((mediaFile, index) => {
        submitData.append(`media_${index}`, mediaFile.file);
        submitData.append(`media_type_${index}`, mediaFile.type);
      });

      const response = await fetch("/api/items", {
        method: "POST",
        body: submitData,
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        setError(data.message || "상품 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setError("상품 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const speciesOptions = [
    "소나무",
    "주목",
    "진백",
    "흑송",
    "단풍",
    "벚나무",
    "은행나무",
    "느티나무",
    "참나무",
    "기타",
  ];

  const styleOptions = [
    "직간",
    "곡간",
    "현애",
    "복륜",
    "문인목",
    "폭포",
    "반폭포",
    "근엽",
    "기타",
  ];

  const sizeClassOptions = [
    "소품 (30cm 이하)",
    "중품 (30-60cm)",
    "대품 (60cm 이상)",
  ];

  const shippingMethodOptions = [
    { value: "DIRECT_PICKUP", label: "직접 픽업" },
    { value: "COURIER", label: "택배" },
    { value: "QUICK", label: "당일배송" },
    { value: "FREIGHT", label: "화물" },
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-black mb-2">
              상품 등록 완료!
            </h2>
            <p className="text-black mb-4">
              상품이 성공적으로 등록되었습니다.
              <br />
              관리자 검수 후 경매가 시작됩니다.
            </p>
            <Button asChild>
              <a href="/">홈으로 돌아가기</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">분재 판매하기</h1>
          <p className="text-black">귀하의 소중한 분재를 경매에 등록하세요</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: "기본 정보" },
              { step: 2, title: "경매 설정" },
              { step: 3, title: "배송 정보" },
              { step: 4, title: "미디어" },
            ].map(({ step, title }) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= step
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-black"
                    }`}
                >
                  {step}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${currentStep >= step ? "text-green-600" : "text-black"
                    }`}
                >
                  {title}
                </span>
                {step < 4 && (
                  <div
                    className={`w-16 h-0.5 mx-4 ${currentStep > step ? "bg-green-600" : "bg-gray-200"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                기본 정보
              </h2>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  상품명 *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  ref={titleRef}
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  placeholder="예: 50년생 흑송 문인목"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  상품 설명
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  placeholder="분재의 특징, 관리 방법 등을 자세히 설명해주세요"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    수종 *
                  </label>
                  <select
                    name="species"
                    required
                    ref={speciesRef}
                    value={formData.species}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  >
                    <option value="" className="text-gray-500">
                      수종을 선택하세요
                    </option>
                    {speciesOptions.map((option) => (
                      <option
                        key={option}
                        value={option}
                        className="text-black"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    수형
                  </label>
                  <select
                    name="style"
                    value={formData.style}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  >
                    <option value="" className="text-gray-500">
                      수형을 선택하세요
                    </option>
                    {styleOptions.map((option) => (
                      <option
                        key={option}
                        value={option}
                        className="text-black"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    높이 (cm)
                  </label>
                  <input
                    type="number"
                    name="heightCm"
                    value={formData.heightCm}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    수관폭 (cm)
                  </label>
                  <input
                    type="number"
                    name="crownWidthCm"
                    value={formData.crownWidthCm}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    간경 (cm)
                  </label>
                  <input
                    type="number"
                    name="trunkDiameterCm"
                    value={formData.trunkDiameterCm}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  추정 수령 (년)
                </label>
                <input
                  type="number"
                  name="ageYearsEst"
                  value={formData.ageYearsEst}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  placeholder="15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  건강 상태
                </label>
                <textarea
                  name="healthNotes"
                  rows={3}
                  value={formData.healthNotes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  placeholder="분재의 건강 상태, 질병 여부 등을 설명해주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  관리 이력
                </label>
                <textarea
                  name="careHistory"
                  rows={3}
                  value={formData.careHistory}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  placeholder="이전 관리 방법, 시기 등을 설명해주세요"
                />
              </div>
            </div>
          )}

          {/* Step 2: Auction Settings */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                경매 설정
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    시작가 (원) *
                  </label>
                  <input
                    type="text"
                    name="startPrice"
                    required
                    ref={startPriceRef}
                    value={formData.startPrice}
                    onChange={handlePriceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="100,000"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 50000, 100000, 500000, 1000000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleQuickPrice('startPrice', amount)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        {amount.toLocaleString()}원
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    입찰 단위 (원) *
                  </label>
                  <input
                    type="text"
                    name="bidStep"
                    required
                    ref={bidStepRef}
                    value={formData.bidStep}
                    onChange={handlePriceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="10,000"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[1000, 5000, 10000, 50000, 100000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleQuickPrice('bidStep', amount)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        {amount.toLocaleString()}원
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    즉시구매가 (원)
                  </label>
                  <input
                    type="text"
                    name="buyNowPrice"
                    value={formData.buyNowPrice}
                    onChange={handlePriceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="500,000"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[100000, 500000, 1000000, 2000000, 5000000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleQuickPrice('buyNowPrice', amount)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        {amount.toLocaleString()}원
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    최저 낙찰가 (원)
                  </label>
                  <input
                    type="text"
                    name="reservePrice"
                    value={formData.reservePrice}
                    onChange={handlePriceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="200,000"
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[10000, 50000, 100000, 200000, 500000, 1000000].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleQuickPrice('reservePrice', amount)}
                        className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                      >
                        {amount.toLocaleString()}원
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    경매 시작일시 *
                  </label>
                  <input
                    type="datetime-local"
                    name="startsAt"
                    required
                    ref={startsAtRef}
                    value={formData.startsAt}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    경매 종료일시 *
                  </label>
                  <input
                    type="datetime-local"
                    name="endsAt"
                    required
                    ref={endsAtRef}
                    value={formData.endsAt}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  자동연장 시간 (분)
                </label>
                <input
                  type="number"
                  name="autoExtendMinutes"
                  value={formData.autoExtendMinutes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  placeholder="5"
                />
                <p className="text-sm text-black mt-1">
                  마지막 입찰 후 자동으로 연장될 시간을 설정하세요
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Shipping Information */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                배송 정보
              </h2>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  배송 방법 *
                </label>
                <select
                  name="shippingMethod"
                  required
                  ref={shippingMethodRef}
                  value={formData.shippingMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                >
                  {shippingMethodOptions.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="text-black"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  배송비 정책
                </label>
                <textarea
                  name="shippingFeePolicy"
                  rows={3}
                  value={formData.shippingFeePolicy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  placeholder="배송비 부담 방법, 지역별 배송비 등을 설명해주세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  포장 주의사항
                </label>
                <textarea
                  name="packagingNotes"
                  rows={3}
                  value={formData.packagingNotes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                  placeholder="분재 포장 시 주의사항, 특별한 요청사항 등을 설명해주세요"
                />
              </div>
            </div>
          )}

          {/* Step 4: Media Upload */}
          {currentStep === 4 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                미디어 업로드
              </h2>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragOver
                  ? "border-green-400 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="media-upload"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label htmlFor="media-upload" className="cursor-pointer block">
                  <Upload
                    className={`mx-auto h-12 w-12 mb-4 ${isDragOver ? "text-green-500" : "text-gray-400"
                      }`}
                  />
                  <p
                    className={`text-lg font-medium mb-2 ${isDragOver ? "text-green-700" : "text-black"
                      }`}
                  >
                    {isDragOver
                      ? "파일을 놓으세요"
                      : "사진과 동영상을 업로드하세요"}
                  </p>
                  <p
                    className={`text-sm ${isDragOver ? "text-green-600" : "text-black"
                      }`}
                  >
                    최대 10개 파일, 각 파일당 10MB 이하
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    또는 파일을 드래그하여 놓으세요
                  </p>
                </label>
              </div>

              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaFiles.map((mediaFile) => (
                    <div key={mediaFile.id} className="relative group">
                      <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                        {mediaFile.type === "IMAGE" ? (
                          <img
                            src={mediaFile.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={mediaFile.preview}
                            className="w-full h-full object-cover"
                            controls
                          />
                        )}
                        <div className="absolute top-2 left-2">
                          {mediaFile.type === "IMAGE" ? (
                            <Camera className="h-4 w-4 text-white" />
                          ) : (
                            <Video className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMediaFile(mediaFile.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="border-2 border-blue-300 text-blue-600 bg-blue-50 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-100 font-semibold px-6 py-2 disabled:border-gray-200 disabled:text-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
            >
              이전
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={goToNextStep}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
              >
                다음
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
              >
                {loading ? "등록 중..." : "상품 등록하기"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
