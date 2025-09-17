"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    nickname: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 비밀번호 확인
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    // 약관 동의 확인
    if (!agreedToTerms || !agreedToPrivacy) {
      setError("이용약관 및 개인정보처리방침에 동의해주세요.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          nickname: formData.nickname,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const isPasswordValid = formData.password.length >= 8;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isFormValid =
    isPasswordValid &&
    isEmailValid &&
    formData.name &&
    formData.nickname &&
    agreedToTerms &&
    agreedToPrivacy;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              회원가입 완료!
            </h2>
            <p className="text-gray-600 mb-4">
              회원가입이 성공적으로 완료되었습니다.
              <br />
              로그인 페이지로 이동합니다...
            </p>
            <Button asChild>
              <Link href="/login">로그인하기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">회원가입</h2>
          <p className="mt-2 text-sm text-gray-600">분재경매에 함께하세요</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  이메일 주소 *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full pl-10 pr-3 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                      formData.email && !isEmailValid
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                {formData.email && !isEmailValid && (
                  <p className="mt-1 text-sm text-red-600">
                    올바른 이메일 형식을 입력해주세요.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700"
                >
                  이름 *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="이름을 입력하세요"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium text-gray-700"
                >
                  닉네임 *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="nickname"
                    name="nickname"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.nickname}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="닉네임을 입력하세요"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700"
                >
                  전화번호
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="전화번호를 입력하세요 (선택사항)"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  비밀번호 *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                      formData.password && !isPasswordValid
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="비밀번호를 입력하세요"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                </div>
                {formData.password && !isPasswordValid && (
                  <p className="mt-1 text-sm text-red-600">
                    비밀번호는 8자 이상이어야 합니다.
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  비밀번호 확인 *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full pl-10 pr-10 py-2 border rounded-md placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                      formData.confirmPassword &&
                      formData.password !== formData.confirmPassword
                        ? "border-red-300"
                        : "border-gray-300"
                    }`}
                    placeholder="비밀번호를 다시 입력하세요"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword &&
                  formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      비밀번호가 일치하지 않습니다.
                    </p>
                  )}
              </div>
            </div>

            {/* Terms and Privacy */}
            <div className="space-y-4">
              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <label
                  htmlFor="terms"
                  className="ml-2 block text-sm text-gray-900"
                >
                  <span className="text-red-500">*</span> 이용약관에 동의합니다.{" "}
                  <Link
                    href="/terms"
                    className="text-green-600 hover:text-green-500 underline"
                  >
                    (자세히 보기)
                  </Link>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="privacy"
                  name="privacy"
                  type="checkbox"
                  checked={agreedToPrivacy}
                  onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <label
                  htmlFor="privacy"
                  className="ml-2 block text-sm text-gray-900"
                >
                  <span className="text-red-500">*</span> 개인정보처리방침에
                  동의합니다.{" "}
                  <Link
                    href="/privacy"
                    className="text-green-600 hover:text-green-500 underline"
                  >
                    (자세히 보기)
                  </Link>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  id="marketing"
                  name="marketing"
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                />
                <label
                  htmlFor="marketing"
                  className="ml-2 block text-sm text-gray-900"
                >
                  마케팅 정보 수신에 동의합니다 (선택)
                </label>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                disabled={loading || !isFormValid}
              >
                {loading ? "회원가입 중..." : "회원가입"}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">또는</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="ml-2">Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
                </svg>
                <span className="ml-2">Kakao</span>
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="font-medium text-green-600 hover:text-green-500"
              >
                로그인하기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
