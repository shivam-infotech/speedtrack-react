import { useNavigate } from "react-router-dom";
import useNativePlatform from "./useNativePlatform";

export default function useNativeNavigateBack() {
    const navigate = useNavigate();
    const { isNative, isWeb, postNativeMessage } = useNativePlatform();

    const navigateBack = () => {
        if (isNative) postNativeMessage("navigation-back");
        else navigate(-1);
    };

    return navigateBack;
}
