export default function PrevIcon({ size = 24, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M18 4l-10 8 10 8V4zm-14 0v16h2V4H4z"
        fill={color}
      />
    </svg>
  );
}

