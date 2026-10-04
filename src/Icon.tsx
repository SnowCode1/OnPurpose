import Svg, { Circle, Path, Polygon } from 'react-native-svg';

type Name = 'history' | 'settings' | 'close' | 'chevron';

// Small, consistent outline icons; no icon font or loading state.
const gear = Array.from({ length: 40 }, (_, index) => {
  const angle = ((index / 40) * 360 - 90) * (Math.PI / 180);
  const radius = index % 5 === 1 || index % 5 === 2 ? 10 : 8;
  return `${12 + Math.cos(angle) * radius},${12 + Math.sin(angle) * radius}`;
}).join(' ');

export function Icon({
  name,
  size = 21,
  color = '#B8B8B8',
}: {
  name: Name;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {name === 'history' && (
        <Path d="M3 10a9 9 0 1 1 2.5 8.2M3 4v6h6M12 7v5l3 2" />
      )}
      {name === 'settings' && (
        <>
          <Polygon points={gear} />
          <Circle cx={12} cy={12} r={3.2} />
        </>
      )}
      {name === 'close' && <Path d="m6 6 12 12M18 6 6 18" />}
      {name === 'chevron' && <Path d="m7 9 5 5 5-5" />}
    </Svg>
  );
}
