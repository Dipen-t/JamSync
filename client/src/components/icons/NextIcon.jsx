export default function NextIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 4l10 8-10 8V4zm14 0v16h-2V4h2z"
        fill={color}
      />
    </svg>
  );
}

