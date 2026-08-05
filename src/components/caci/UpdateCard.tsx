"use client";

import { useState, type ElementType } from "react";

export interface UpdateCardItem {
  id: string;
  title: string;
  sub: string;
  image: string;
  icon: ElementType;
}

interface UpdateCardProps {
  item: UpdateCardItem;
  onClick?: () => void;
}

/**
 * UpdateCard
 *
 * Renders one of two layouts depending on the actual aspect ratio of the
 * provided image — detected via the native <img> onLoad event:
 *
 *   landscape (w > h)  →  image on top, text + icon row below
 *   portrait  (w ≤ h)  →  full-bleed image with text overlaid on gradient
 *
 * Falls back to portrait while the image is loading to avoid layout shift.
 */
export function UpdateCard({ item, onClick }: UpdateCardProps) {
  const [isLandscape, setIsLandscape] = useState<boolean>(false);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setIsLandscape(naturalWidth > naturalHeight);
  };

  const Icon = item.icon;

  if (isLandscape) {
    return (
      <div
        onClick={onClick}
        className="min-w-[160px] w-[160px] snap-start flex-shrink-0 cursor-pointer hover:scale-[1.05] transition-transform duration-300"
      >
        <div className="w-full h-[240px] bg-white p-[5px] rounded-[15px] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.12)] border border-slate-100/80 flex flex-col">
          <div className="relative w-full h-[156px] overflow-hidden rounded-[7px] group">
            <img
              src={item.image}
              alt={item.title}
              onLoad={handleImageLoad}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
          <div className="flex items-center justify-between pt-3 pb-1 px-2 flex-1">
            <div className="flex flex-col">
              <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight">
                {item.title}
              </h3>
              <span className="text-[12px] text-slate-400 font-medium mt-0.5">
                {item.sub}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center shadow-sm">
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Portrait (default while loading + for tall images)
  return (
    <div
      onClick={onClick}
      className="min-w-[160px] w-[160px] snap-start flex-shrink-0 cursor-pointer hover:scale-[1.05] transition-transform duration-300"
    >
      <div className="relative w-full h-[240px] bg-white p-[5px] rounded-[15px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] border border-slate-100/80 overflow-hidden">
        <div className="relative w-full h-full rounded-[7px] overflow-hidden group">
          <img
            src={item.image}
            alt={item.title}
            onLoad={handleImageLoad}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 h-[70%] bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
          <div className="absolute top-3 right-3 p-2.5 rounded-full border border-white/30 bg-white/20 backdrop-blur-md text-white shadow-sm">
            <Icon className="w-4 h-4" />
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white z-10">
            <h3 className="text-[20px] font-extrabold tracking-tight mb-0.5">
              {item.title}
            </h3>
            <p className="text-[13px] text-gray-300 font-medium">{item.sub}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
