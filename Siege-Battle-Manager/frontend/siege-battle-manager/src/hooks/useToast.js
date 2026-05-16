import { useRef, useState } from "react";

export function useToast(duration = 1000) {
  const [toastMessage, setToastMessage] = useState("");
  const timerRef = useRef(null);

  function showToast(message) {
    setToastMessage(message);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setToastMessage("");
      timerRef.current = null;
    }, duration);
  }

  return {
    toastMessage,
    showToast,
  };
}