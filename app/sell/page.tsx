"use client";

import { useState } from "react";
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

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "IMAGE" | "VIDEO";
}

export default function SellPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const [formData, setFormData] = useState({
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
    startsAt: "",
    endsAt: "",
    autoExtendMinutes: "",

    // 배송 정보
    shippingMethod: "COURIER",
    shippingFeePolicy: "",
    packagingNotes: "",
  });

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
              { step: 3, title: "미디어" },
              { step: 4, title: "배송 정보" },
            ].map(({ step, title }) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  {step}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    currentStep >= step ? "text-green-600" : "text-black"
                  }`}
                >
                  {title}
                </span>
                {step < 4 && (
                  <div
                    className={`w-16 h-0.5 mx-4 ${
                      currentStep > step ? "bg-green-600" : "bg-gray-200"
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
                    value={formData.startPrice}
                    onChange={handlePriceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="100,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    입찰 단위 (원) *
                  </label>
                  <input
                    type="text"
                    name="bidStep"
                    required
                    value={formData.bidStep}
                    onChange={handlePriceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-500 text-black"
                    placeholder="10,000"
                  />
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

          {/* Step 3: Media Upload */}
          {currentStep === 3 && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-xl font-semibold text-black mb-4">
                미디어 업로드
              </h2>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  isDragOver
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
                    className={`mx-auto h-12 w-12 mb-4 ${
                      isDragOver ? "text-green-500" : "text-gray-400"
                    }`}
                  />
                  <p
                    className={`text-lg font-medium mb-2 ${
                      isDragOver ? "text-green-700" : "text-black"
                    }`}
                  >
                    {isDragOver
                      ? "파일을 놓으세요"
                      : "사진과 동영상을 업로드하세요"}
                  </p>
                  <p
                    className={`text-sm ${
                      isDragOver ? "text-green-600" : "text-black"
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

          {/* Step 4: Shipping Information */}
          {currentStep === 4 && (
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
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
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
