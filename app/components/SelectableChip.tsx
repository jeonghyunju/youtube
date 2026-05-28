'use client';

interface SelectableChipProps {
  id: string;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'purple' | 'mono'; // 💡 테마 선택 옵션 (기본값: purple)
  size?: 'sm' | 'xs';          // 💡 크기 선택 옵션 (기본값: xs)
}

export default function SelectableChip({
  id,
  label,
  isSelected,
  onClick,
  variant = 'purple',
  size = 'xs'
}: SelectableChipProps) {
  
  // 1. 크기(Size)에 따른 테일윈드 클래스 분기
  const sizeClasses = size === 'sm' 
    ? 'px-3 py-1.5 text-xs font-medium' 
    : 'px-2.5 py-1.5 text-[10px] font-bold';

  // 2. 테마(Variant) 컬러에 따른 테일윈드 클래스 분기
  const variantClasses = variant === 'purple'
    ? isSelected
      ? 'bg-indigo-600 text-white border-indigo-600'
      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
    : isSelected // 'mono' (메인 대시보드 흑백 톤)
      ? 'bg-neutral-100 text-neutral-950 border-neutral-100 shadow-lg'
      : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-neutral-200';

  return (
    <button
      key={id}
      type="button"
      onClick={onClick}
      className={`rounded-lg border transition-all duration-200 ${sizeClasses} ${variantClasses}`}
    >
      {label}
    </button>
  );
}