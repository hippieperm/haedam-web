import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ItemStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as ItemStatus | null;
    const species = searchParams.get("species");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: status || ItemStatus.LIVE,
      deletedAt: null,
    };

    if (species) {
      where.species = { contains: species, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.currentPrice = {};
      if (minPrice) where.currentPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.currentPrice.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { species: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by
    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "price_asc":
        orderBy = { currentPrice: "asc" };
        break;
      case "price_desc":
        orderBy = { currentPrice: "desc" };
        break;
      case "ending_soon":
        orderBy = { endsAt: "asc" };
        break;
      case "most_watched":
        orderBy = { watchlists: { _count: "desc" } };
        break;
      case "most_bids":
        orderBy = { bids: { _count: "desc" } };
        break;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        seller: {
          select: { id: true, name: true, nickname: true },
        },
        media: {
          orderBy: { sort: "asc" },
          take: 1,
        },
        _count: {
          select: { bids: true, watchlists: true },
        },
        bids: {
          orderBy: { amount: "desc" },
          take: 1,
          select: { amount: true, createdAt: true },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const total = await prisma.item.count({ where });

    return NextResponse.json({
      success: true,
      data: {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return NextResponse.json(
      { success: false, message: "상품 목록을 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    // FormData 처리
    const formData = await request.formData();

    // 기본 상품 정보
    const itemData = {
      sellerId: user.id,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      species: formData.get("species") as string,
      style: (formData.get("style") as string) || null,
      sizeClass: (formData.get("sizeClass") as string) || null,
      heightCm: formData.get("heightCm")
        ? parseFloat(formData.get("heightCm") as string)
        : null,
      crownWidthCm: formData.get("crownWidthCm")
        ? parseFloat(formData.get("crownWidthCm") as string)
        : null,
      trunkDiameterCm: formData.get("trunkDiameterCm")
        ? parseFloat(formData.get("trunkDiameterCm") as string)
        : null,
      ageYearsEst: formData.get("ageYearsEst")
        ? parseInt(formData.get("ageYearsEst") as string)
        : null,
      healthNotes: (formData.get("healthNotes") as string) || null,
      originNotes: (formData.get("originNotes") as string) || null,
      careHistory: (formData.get("careHistory") as string) || null,
      status: ItemStatus.PENDING_REVIEW,
      startPrice: parseFloat(formData.get("startPrice") as string),
      currentPrice: parseFloat(formData.get("startPrice") as string),
      buyNowPrice: formData.get("buyNowPrice")
        ? parseFloat(formData.get("buyNowPrice") as string)
        : null,
      reservePrice: formData.get("reservePrice")
        ? parseFloat(formData.get("reservePrice") as string)
        : null,
      bidStep: parseFloat(formData.get("bidStep") as string),
      startsAt: new Date(formData.get("startsAt") as string),
      endsAt: new Date(formData.get("endsAt") as string),
      autoExtendMinutes: formData.get("autoExtendMinutes")
        ? parseInt(formData.get("autoExtendMinutes") as string)
        : null,
      shippingMethod: formData.get("shippingMethod") as string,
      shippingFeePolicy: (formData.get("shippingFeePolicy") as string) || null,
      packagingNotes: (formData.get("packagingNotes") as string) || null,
    };

    // 상품 생성
    const item = await prisma.item.create({
      data: itemData,
    });

    // 미디어 파일 처리 (실제로는 파일 업로드 서비스에 업로드해야 함)
    const mediaFiles = [];
    let mediaIndex = 0;

    while (formData.has(`media_${mediaIndex}`)) {
      const file = formData.get(`media_${mediaIndex}`) as File;
      const mediaType = formData.get(`media_type_${mediaIndex}`) as string;

      if (file) {
        // 실제 환경에서는 파일을 클라우드 스토리지에 업로드하고 URL을 받아야 함
        // 여기서는 임시로 placeholder URL 사용
        const mediaUrl = `https://via.placeholder.com/800x600?text=${encodeURIComponent(
          file.name
        )}`;

        mediaFiles.push({
          itemId: item.id,
          url: mediaUrl,
          type: mediaType,
          sort: mediaIndex,
        });
      }

      mediaIndex++;
    }

    // 미디어 파일 저장
    if (mediaFiles.length > 0) {
      await prisma.itemMedia.createMany({
        data: mediaFiles,
      });
    }

    return NextResponse.json({
      success: true,
      data: item,
      message:
        "상품이 성공적으로 등록되었습니다. 관리자 검수 후 경매가 시작됩니다.",
    });
  } catch (error) {
    console.error("Failed to create item:", error);
    return NextResponse.json(
      { success: false, message: "상품 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
