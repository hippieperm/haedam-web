import Link from "next/link";
import Image from "next/image";
import { Heart, Eye, Clock } from "lucide-react";
import { formatPrice, formatTimeRemaining } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ItemCardProps {
  item: {
    id: string;
    title: string;
    species: string;
    currentPrice: number;
    buyNowPrice?: number | null;
    endsAt: string;
    status: string;
    coverImageUrl?: string | null;
    media?: { url: string }[];
    _count: {
      bids: number;
      watchlists: number;
    };
    seller: {
      nickname: string | null;
    };
  };
}

export function ItemCard({ item }: ItemCardProps) {
  const imageUrl =
    item.coverImageUrl || item.media?.[0]?.url || "/placeholder-bonsai.jpg";
  const isLive = item.status === "LIVE";
  const timeRemaining = isLive ? formatTimeRemaining(item.endsAt) : null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/items/${item.id}`}>
        <div className="relative aspect-square">
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          {item.status === "LIVE" && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              경매중
            </div>
          )}
          {item.buyNowPrice && (
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
              즉시구매
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/items/${item.id}`}>
          <h3 className="font-bold text-xl text-black mb-2 line-clamp-2 hover:text-green-600 transition-colors">
            {item.title}
          </h3>
        </Link>

        <div className="text-sm text-gray-700 mb-2 font-medium">
          <span>{item.species}</span>
          {item.seller.nickname && (
            <>
              {" · "}
              <span>{item.seller.nickname}</span>
            </>
          )}
        </div>

        <div className="mb-3">
          <div className="text-xl font-bold text-green-600 mb-1">
            {formatPrice(item.currentPrice)}원
          </div>
          {item.buyNowPrice && (
            <div className="text-sm text-gray-600 font-medium">
              즉시구매: {formatPrice(item.buyNowPrice)}원
            </div>
          )}
        </div>

        {isLive && timeRemaining && (
          <div className="flex items-center text-sm text-red-600 mb-3 font-medium">
            <Clock className="h-4 w-4 mr-1" />
            <span>{timeRemaining}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-3">
            <span className="font-medium">입찰 {item._count.bids}</span>
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              <span className="font-medium">{item._count.watchlists}</span>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          {isLive && (
            <Button
              asChild
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              <Link href={`/items/${item.id}`}>입찰하기</Link>
            </Button>
          )}
          {item.buyNowPrice && isLive && (
            <Button
              variant="outline"
              asChild
              className="flex-1 border-2 border-orange-300 text-orange-600 bg-orange-50 hover:border-orange-400 hover:text-orange-700 hover:bg-orange-100 font-semibold"
            >
              <Link href={`/items/${item.id}/buy-now`}>즉시구매</Link>
            </Button>
          )}
          {!isLive && (
            <Button
              variant="outline"
              asChild
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
            >
              <Link href={`/items/${item.id}`}>상세보기</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
