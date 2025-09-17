import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class StorageService {
  private static bucketName =
    process.env.AWS_S3_BUCKET || "bonsai-auction-images";

  // 이미지 업로드
  static async uploadImage(
    file: Buffer,
    fileName: string,
    contentType: string,
    folder: "items" | "profiles" | "temp" = "items"
  ): Promise<{ url: string; key: string }> {
    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      ACL: "public-read",
    });

    await s3Client.send(command);

    const url = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { url, key };
  }

  // 다중 이미지 업로드
  static async uploadMultipleImages(
    files: Array<{ buffer: Buffer; fileName: string; contentType: string }>,
    folder: "items" | "profiles" | "temp" = "items"
  ): Promise<Array<{ url: string; key: string }>> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(file.buffer, file.fileName, file.contentType, folder)
    );

    return Promise.all(uploadPromises);
  }

  // 이미지 삭제
  static async deleteImage(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await s3Client.send(command);
  }

  // 다중 이미지 삭제
  static async deleteMultipleImages(keys: string[]): Promise<void> {
    const deletePromises = keys.map((key) => this.deleteImage(key));
    await Promise.all(deletePromises);
  }

  // 프리사인드 URL 생성 (직접 업로드용)
  static async generatePresignedUrl(
    fileName: string,
    contentType: string,
    folder: "items" | "profiles" | "temp" = "items"
  ): Promise<{ uploadUrl: string; fileUrl: string; key: string }> {
    const key = `${folder}/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: "public-read",
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });
    const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl, key };
  }

  // 이미지 리사이징 (Lambda 함수와 연동)
  static generateResizedUrls(
    originalKey: string,
    sizes: number[] = [300, 600, 1200]
  ) {
    const baseUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`;

    return sizes.map((size) => ({
      size,
      url: `${baseUrl}/resized/${size}/${originalKey}`,
    }));
  }

  // 이미지 최적화 URL 생성
  static getOptimizedImageUrl(
    key: string,
    width?: number,
    height?: number,
    quality = 80
  ) {
    const baseUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com`;

    if (width || height) {
      return `${baseUrl}/optimized/${width || "auto"}x${
        height || "auto"
      }/q${quality}/${key}`;
    }

    return `${baseUrl}/${key}`;
  }
}

// 파일 유효성 검사
export class FileValidator {
  static validateImage(file: { size: number; type: string; name: string }) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

    const errors: string[] = [];

    if (file.size > maxSize) {
      errors.push("파일 크기는 10MB를 초과할 수 없습니다.");
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push("지원되는 이미지 형식: JPEG, PNG, WebP, AVIF");
    }

    const extension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));
    if (!allowedExtensions.includes(extension)) {
      errors.push("지원되는 파일 확장자: .jpg, .jpeg, .png, .webp, .avif");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
