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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [shippingCost, setShippingCost] = useState<number>(0);

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

  // 자동 저장 기능
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const savedData = localStorage.getItem(`draft_${user.id}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(parsed.formData);
          setCurrentStep(parsed.currentStep || 1);
          setTags(parsed.tags || []);
        } catch (error) {
          console.error('Failed to load saved draft:', error);
        }
      }
    }
  }, [user]);

  // 폼 데이터 변경 시 자동 저장
  useEffect(() => {
    if (typeof window !== 'undefined' && user) {
      const timeoutId = setTimeout(() => {
        const draftData = {
          formData,
          currentStep,
          tags,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(`draft_${user.id}`, JSON.stringify(draftData));
      }, 1000); // 1초 후 저장

      return () => clearTimeout(timeoutId);
    }
  }, [formData, currentStep, tags, user]);

  // 가격 유효성 검사 함수
  const validatePrices = (): { isValid: boolean; message: string } => {
    const startPrice = formData.startPrice ? parsePriceInput(formData.startPrice) : 0;
    const reservePrice = formData.reservePrice ? parsePriceInput(formData.reservePrice) : 0;
    const buyNowPrice = formData.buyNowPrice ? parsePriceInput(formData.buyNowPrice) : 0;

    // 최저 낙찰가는 시작가보다 높아야 함
    if (reservePrice > 0 && startPrice > 0 && reservePrice <= startPrice) {
      return { isValid: false, message: "최저 낙찰가는 시작가보다 높아야 합니다." };
    }

    // 즉시구매가는 최저 낙찰가보다 높아야 함
    if (buyNowPrice > 0 && reservePrice > 0 && buyNowPrice <= reservePrice) {
      return { isValid: false, message: "즉시구매가는 최저 낙찰가보다 높아야 합니다." };
    }

    // 즉시구매가는 시작가보다 높아야 함
    if (buyNowPrice > 0 && startPrice > 0 && buyNowPrice <= startPrice) {
      return { isValid: false, message: "즉시구매가는 시작가보다 높아야 합니다." };
    }

    return { isValid: true, message: "" };
  };

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

        // 가격 유효성 검사
        const priceValidation = validatePrices();

        return hasRequiredFields && isValidTimeRange && priceValidation.isValid;
      case 3: // 배송 정보
        return !!(formData.shippingMethod);
      case 4: // 미디어 (필수)
        return mediaFiles.length >= 1; // 최소 1장 이상의 이미지 필요
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

        // 가격 유효성 검사
        const priceValidation = validatePrices();
        if (!priceValidation.isValid) {
          missingFields.push(priceValidation.message);
          if (!firstEmptyFieldRef) firstEmptyFieldRef = startPriceRef;
        }
      } else if (currentStep === 3) {
        if (!formData.shippingMethod) {
          missingFields.push("배송 방법");
          if (!firstEmptyFieldRef) firstEmptyFieldRef = shippingMethodRef;
        }
      } else if (currentStep === 4) {
        if (mediaFiles.length < 1) {
          missingFields.push("최소 1장 이상의 이미지");
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

    // 높이 변경 시 배송비 재계산
    if (name === "heightCm") {
      const cost = calculateShippingCost(formData.shippingMethod, value);
      setShippingCost(cost);
    }

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

  // 이미지 순서 변경 함수
  const moveMediaFile = (dragIndex: number, dropIndex: number) => {
    setMediaFiles((prev) => {
      const newFiles = [...prev];
      const draggedFile = newFiles[dragIndex];
      newFiles.splice(dragIndex, 1);
      newFiles.splice(dropIndex, 0, draggedFile);
      return newFiles;
    });
  };

  // 태그 관리 함수들
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags((prev) => [...prev, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  // 배송비 계산 함수
  const calculateShippingCost = (method: string, heightCm?: string) => {
    const height = heightCm ? parseFloat(heightCm) : 0;
    
    switch (method) {
      case "DIRECT_PICKUP":
        return 0;
      case "COURIER":
        if (height <= 30) return 3000;
        if (height <= 60) return 5000;
        return 8000;
      case "QUICK":
        if (height <= 30) return 8000;
        if (height <= 60) return 12000;
        return 15000;
      case "FREIGHT":
        if (height <= 100) return 15000;
        if (height <= 150) return 25000;
        return 35000;
      default:
        return 0;
    }
  };

  // 배송 방법 변경 시 배송비 자동 계산
  const handleShippingMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const method = e.target.value;
    const cost = calculateShippingCost(method, formData.heightCm);
    setShippingCost(cost);
    handleInputChange(e);
  };

  // 경매 일정 추천 함수
  const getOptimalAuctionTimes = () => {
    const now = new Date();
    const recommendations = [];

    // 이번 주 일요일 오후 7시 (가장 인기 있는 시간)
    const thisWeekSunday = new Date(now);
    thisWeekSunday.setDate(now.getDate() + (7 - now.getDay()) % 7);
    thisWeekSunday.setHours(19, 0, 0, 0);
    if (thisWeekSunday > now) {
      const endTime = new Date(thisWeekSunday);
      endTime.setDate(endTime.getDate() + 3); // 3일 경매
      recommendations.push({
        label: "이번 주 일요일 저녁 (추천)",
        start: thisWeekSunday,
        end: endTime,
        reason: "가장 많은 사용자가 접속하는 시간"
      });
    }

    // 다음 주 일요일 오후 7시
    const nextWeekSunday = new Date(thisWeekSunday);
    nextWeekSunday.setDate(nextWeekSunday.getDate() + 7);
    const nextWeekEnd = new Date(nextWeekSunday);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 3);
    recommendations.push({
      label: "다음 주 일요일 저녁",
      start: nextWeekSunday,
      end: nextWeekEnd,
      reason: "충분한 준비 시간 확보"
    });

    // 평일 저녁 8시 (직장인 대상)
    const weekdayEvening = new Date(now);
    weekdayEvening.setDate(now.getDate() + (now.getDay() === 0 ? 3 : 5 - now.getDay()));
    weekdayEvening.setHours(20, 0, 0, 0);
    if (weekdayEvening > now) {
      const weekdayEnd = new Date(weekdayEvening);
      weekdayEnd.setDate(weekdayEnd.getDate() + 2); // 2일 경매
      recommendations.push({
        label: "평일 저녁",
        start: weekdayEvening,
        end: weekdayEnd,
        reason: "직장인 접속 시간대"
      });
    }

    return recommendations;
  };

  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const applyRecommendedTime = (start: Date, end: Date) => {
    setFormData(prev => ({
      ...prev,
      startsAt: formatDateTime(start),
      endsAt: formatDateTime(end)
    }));
  };

  // 파일을 base64로 변환하는 함수
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // 수종별 가격 가이드
  const getPriceGuide = (species: string) => {
    const guides: { [key: string]: { min: number; max: number; description: string } } = {
      "소나무": { min: 50000, max: 500000, description: "일반적인 국내 소나무 분재" },
      "주목": { min: 80000, max: 800000, description: "관리가 까다로운 고급 수종" },
      "진백": { min: 30000, max: 300000, description: "초보자도 기르기 쉬운 수종" },
      "흑송": { min: 100000, max: 1000000, description: "일본 전통 분재의 대표 수종" },
      "단풍": { min: 40000, max: 400000, description: "계절 변화가 아름다운 수종" },
      "벚나무": { min: 60000, max: 600000, description: "꽃이 피는 화분류" },
      "은행나무": { min: 70000, max: 700000, description: "낙엽 활엽수 중 인기 수종" },
      "느티나무": { min: 50000, max: 500000, description: "잎이 작고 분지가 좋은 수종" },
      "참나무": { min: 40000, max: 400000, description: "국내 자생종으로 관리 용이" },
      "기타": { min: 30000, max: 300000, description: "기타 수종" }
    };

    return guides[species] || guides["기타"];
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

  // 중복 상품 체크 함수
  const checkDuplicateProduct = async () => {
    try {
      const response = await fetch(`/api/items?search=${encodeURIComponent(formData.title)}&status=LIVE`);
      const data = await response.json();
      
      if (data.success && data.data.items.length > 0) {
        const similarItems = data.data.items.filter((item: any) => {
          // 제목 유사도 체크 (80% 이상 유사)
          const similarity = calculateSimilarity(formData.title.toLowerCase(), item.title.toLowerCase());
          return similarity > 0.8;
        });

        if (similarItems.length > 0) {
          const confirm = window.confirm(
            `유사한 상품이 이미 등록되어 있습니다:\n"${similarItems[0].title}"\n\n그래도 등록하시겠습니까?`
          );
          return confirm;
        }
      }
      return true;
    } catch (error) {
      console.error('중복 체크 중 오류:', error);
      return true; // 오류 시에는 등록 허용
    }
  };

  // 문자열 유사도 계산 (Levenshtein distance 기반)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 중복 상품 체크
      const canProceed = await checkDuplicateProduct();
      if (!canProceed) {
        setLoading(false);
        return;
      }
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

      // 태그 추가
      if (tags.length > 0) {
        submitData.append('tags', JSON.stringify(tags));
      }

      // 미디어 파일을 base64로 변환하여 추가
      for (let index = 0; index < mediaFiles.length; index++) {
        const mediaFile = mediaFiles[index];
        try {
          const base64 = await fileToBase64(mediaFile.file);
          submitData.append(`media_${index}_base64`, base64);
          submitData.append(`media_${index}_name`, mediaFile.file.name);
          submitData.append(`media_type_${index}`, mediaFile.type);
        } catch (error) {
          console.error(`미디어 파일 ${index} 처리 중 오류:`, error);
        }
      }

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
            ].map(({ step, title }) => {
              const isCompleted = validateStep(step);
              const isCurrent = currentStep === step;
              const isPassed = currentStep > step;
              
              return (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium relative ${
                        isPassed
                          ? "bg-green-600 text-white"
                          : isCurrent
                          ? isCompleted
                            ? "bg-green-600 text-white"
                            : "bg-blue-500 text-white"
                          : "bg-gray-200 text-black"
                      }`}
                    >
                      {isPassed || (isCurrent && isCompleted) ? "✓" : step}
                      {isCurrent && !isCompleted && (
                        <div className="absolute -inset-1 rounded-full border-2 border-blue-300 animate-pulse"></div>
                      )}
                    </div>
                    <span
                      className={`mt-1 text-xs font-medium ${
                        isPassed || (isCurrent && isCompleted)
                          ? "text-green-600"
                          : isCurrent
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    >
                      {title}
                    </span>
                    {/* Progress percentage */}
                    {isCurrent && (
                      <div className="mt-1 text-xs text-gray-500">
                        {isCompleted ? "완료" : "진행중"}
                      </div>
                    )}
                  </div>
                  {step < 4 && (
                    <div
                      className={`w-16 h-0.5 mx-4 ${
                        isPassed ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
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

              {/* Tags Section */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  검색 태그 (최대 10개)
                </label>
                <div className="space-y-2">
                  {/* Existing Tags */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-green-600 hover:text-green-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Tag Input */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="태그를 입력하고 Enter 또는 쉼표를 누르세요"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                      disabled={tags.length >= 10}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(tagInput)}
                      disabled={!tagInput.trim() || tags.length >= 10}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      추가
                    </button>
                  </div>
                  
                  {/* Suggested Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500">추천 태그:</span>
                    {["실내분재", "야외분재", "초보자용", "고급자용", "희귀품종", "화분포함"].map((suggestedTag) => (
                      !tags.includes(suggestedTag) && tags.length < 10 && (
                        <button
                          key={suggestedTag}
                          type="button"
                          onClick={() => addTag(suggestedTag)}
                          className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border"
                        >
                          + {suggestedTag}
                        </button>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Auction Settings */}
          {currentStep === 2 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                경매 설정
              </h2>

              {/* 수종별 가격 가이드 */}
              {formData.species && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-900 mb-2">💰 {formData.species} 가격 가이드</h4>
                  {(() => {
                    const guide = getPriceGuide(formData.species);
                    return (
                      <div className="text-sm text-green-800">
                        <p className="mb-1">{guide.description}</p>
                        <p className="font-medium">권장 가격대: {guide.min.toLocaleString()}원 ~ {guide.max.toLocaleString()}원</p>
                        <div className="flex gap-2 mt-2">
                          <button
                            type="button"
                            onClick={() => handleQuickPrice('startPrice', guide.min)}
                            className="px-2 py-1 text-xs bg-green-200 hover:bg-green-300 text-green-800 rounded"
                          >
                            최소가 적용
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickPrice('startPrice', Math.floor((guide.min + guide.max) / 2))}
                            className="px-2 py-1 text-xs bg-green-200 hover:bg-green-300 text-green-800 rounded"
                          >
                            평균가 적용
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

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

              {/* 경매 일정 추천 */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-3">🕒 추천 경매 일정</h4>
                <div className="space-y-2">
                  {getOptimalAuctionTimes().map((recommendation, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-black">{recommendation.label}</div>
                        <div className="text-xs text-gray-500">{recommendation.reason}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {recommendation.start.toLocaleDateString('ko-KR')} {recommendation.start.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} ~ {recommendation.end.toLocaleDateString('ko-KR')} {recommendation.end.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => applyRecommendedTime(recommendation.start, recommendation.end)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        적용
                      </button>
                    </div>
                  ))}
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
                  onChange={handleShippingMethodChange}
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
                
                {/* 배송비 표시 */}
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">예상 배송비</span>
                    <span className="font-semibold text-green-600">
                      {shippingCost.toLocaleString()}원
                    </span>
                  </div>
                  {formData.shippingMethod !== "DIRECT_PICKUP" && (
                    <p className="text-xs text-gray-500 mt-1">
                      * 분재 높이 ({formData.heightCm || "미입력"}cm) 기준으로 계산됨
                    </p>
                  )}
                  
                  {/* 배송비 상세 정보 */}
                  <div className="mt-2 text-xs text-gray-500">
                    <div className="grid grid-cols-2 gap-2">
                      {formData.shippingMethod === "COURIER" && (
                        <>
                          <div>30cm 이하: 3,000원</div>
                          <div>60cm 이하: 5,000원</div>
                          <div>60cm 초과: 8,000원</div>
                        </>
                      )}
                      {formData.shippingMethod === "QUICK" && (
                        <>
                          <div>30cm 이하: 8,000원</div>
                          <div>60cm 이하: 12,000원</div>
                          <div>60cm 초과: 15,000원</div>
                        </>
                      )}
                      {formData.shippingMethod === "FREIGHT" && (
                        <>
                          <div>100cm 이하: 15,000원</div>
                          <div>150cm 이하: 25,000원</div>
                          <div>150cm 초과: 35,000원</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
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
                  {mediaFiles.map((mediaFile, index) => (
                    <div 
                      key={mediaFile.id} 
                      className="relative group cursor-move"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("dragIndex", index.toString());
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));
                        const dropIndex = index;
                        if (dragIndex !== dropIndex) {
                          moveMediaFile(dragIndex, dropIndex);
                        }
                      }}
                    >
                      <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-300 transition-colors">
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
                        <div className="absolute top-2 left-2 flex items-center space-x-1">
                          {mediaFile.type === "IMAGE" ? (
                            <Camera className="h-4 w-4 text-white" />
                          ) : (
                            <Video className="h-4 w-4 text-white" />
                          )}
                          <span className="text-white text-xs bg-black bg-opacity-50 px-1 rounded">
                            {index + 1}
                          </span>
                        </div>
                        {/* Drag indicator */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black bg-opacity-50 text-white p-1 rounded text-xs">
                            ⋮⋮
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMediaFile(mediaFile.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Help Text for Drag & Drop */}
              {mediaFiles.length > 1 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  이미지를 드래그해서 순서를 변경할 수 있습니다
                </p>
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

          {/* Real-time Preview */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-black mb-4">미리보기</h3>
                
                {/* Preview Card */}
                <div className="border rounded-lg overflow-hidden">
                  {/* Image Preview */}
                  <div className="aspect-square bg-gray-100 relative">
                    {mediaFiles.length > 0 ? (
                      <img
                        src={mediaFiles[0].preview}
                        alt="미리보기"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Camera className="h-12 w-12" />
                      </div>
                    )}
                    {mediaFiles.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                        +{mediaFiles.length - 1}
                      </div>
                    )}
                  </div>

                  {/* Content Preview */}
                  <div className="p-4">
                    <h4 className="font-semibold text-black mb-2">
                      {formData.title || "상품명을 입력하세요"}
                    </h4>
                    
                    {formData.species && (
                      <p className="text-sm text-gray-600 mb-2">
                        {formData.species} • {formData.style || "수형 미지정"}
                      </p>
                    )}

                    {(formData.heightCm || formData.ageYearsEst) && (
                      <p className="text-xs text-gray-500 mb-3">
                        {formData.heightCm && `높이: ${formData.heightCm}cm`}
                        {formData.heightCm && formData.ageYearsEst && " • "}
                        {formData.ageYearsEst && `수령: ${formData.ageYearsEst}년`}
                      </p>
                    )}

                    {formData.startPrice && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">시작가</span>
                          <span className="font-semibold text-green-600">
                            {formData.startPrice}원
                          </span>
                        </div>
                        
                        {formData.buyNowPrice && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">즉시구매</span>
                            <span className="text-sm text-blue-600">
                              {formData.buyNowPrice}원
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {formData.endsAt && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          경매 종료: {new Date(formData.endsAt).toLocaleDateString('ko-KR')} {new Date(formData.endsAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Summary */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">작성 진행도</div>
                  <div className="space-y-1">
                    {[
                      { step: 1, name: "기본정보", completed: validateStep(1) },
                      { step: 2, name: "경매설정", completed: validateStep(2) },
                      { step: 3, name: "배송정보", completed: validateStep(3) },
                      { step: 4, name: "미디어", completed: validateStep(4) },
                    ].map(({ step, name, completed }) => (
                      <div key={step} className="flex items-center justify-between text-xs">
                        <span className={completed ? "text-green-600" : "text-gray-500"}>
                          {name}
                        </span>
                        <span className={completed ? "text-green-600" : "text-gray-400"}>
                          {completed ? "✓" : "○"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
