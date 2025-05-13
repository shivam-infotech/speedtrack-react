import { useNavigate } from "react-router-dom";
import useNativePlatform from "./useNativePlatform";

export default function useNativeNavigateBack() {
    const navigate = useNavigate();
    const { isNative, nativeBack } = useNativePlatform();

    const navigateBack = () => {
        if (isNative) {
            try {
                nativeBack(); // 👈 Using the optimized back function
            } catch (e) {
                console.error("Navigation failed", e);
            }
        } else {
            navigate(-1); // Standard React Router back
        }
    };

    return navigateBack;
}
