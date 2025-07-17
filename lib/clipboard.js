import { toast } from "sonner";

export const copyToClipboard = async (text, successMessage = "Panoya kopyalandı!") => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      toast.success(successMessage);
    } catch (fallbackErr) {
      toast.error("Kopyalama başarısız oldu");
    }
    document.body.removeChild(textArea);
  }
};
