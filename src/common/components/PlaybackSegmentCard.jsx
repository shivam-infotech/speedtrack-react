import { Box, Card, CardContent, IconButton, Typography } from "@mui/material";
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import PinDropIcon from '@mui/icons-material/PinDrop';
import ShareIcon from '@mui/icons-material/Share';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import SpeedIcon from '@mui/icons-material/Speed';
import CloseIcon from '@mui/icons-material/Close';
import { useTranslation } from "./LocalizationProvider";
import { prefixString } from "../util/stringUtils";
import useNativePlatform from "../util/useNativePlatform";
import { useState } from "react";
import CheckIcon from '@mui/icons-material/Check';


export default function PlaybackSegmentCard({
    deviceName,
    startTime,
    endTime,
    duration,
    location,
    speed = null,
    coords = null,
    segmentOf = null,
    onClose = () => { }
}) {
    const t = useTranslation();
    const { isNative, postNativeMessage } = useNativePlatform();
    const [copied, setCopied] = useState(false);


    const prepareShareableContent = () => {
        return `${deviceName} 
            ${t('reportStartTime')}: ${startTime.toLocaleTimeString()}
            ${t('reportEndTime')}: ${endTime.toLocaleTimeString()}
            ${t('reportDuration')}: ${duration}
            ${t('positionAddress')}: ${location || t('positionNoAddress')}
            ${t('linkGoogleMaps')}: ${createGoogleMapLink() || t('linkNotAvailable')}
        `;
    }

    const handleCopy = async () => {
        try {
            if(isNative){
                postNativeMessage('clipboard-copy', {text: prepareShareableContent()})
            }else await navigator.clipboard.writeText(prepareShareableContent());

            setCopied(true);
            setTimeout(() => setCopied(false), 5000);
        } catch (err) {
            console.error("Copy failed:", err);
        }
    };

    const handleShare = () => {
        if(isNative){
            postNativeMessage('share-text', { title: `${deviceName} - ${t(prefixString('report', segmentOf))} ${t('sharedInfoTitle')}`, text: prepareShareableContent() })
        }else if (navigator.share) {
            navigator.share({
                title: `${deviceName} - ${t(prefixString('report', segmentOf))} ${t('sharedInfoTitle')}`,
                text: prepareShareableContent(),
            }).catch(console.error);
        } else {
            alert('Sharing not supported in your device');
        }
    };

    const createGoogleMapLink = () => {
        if (coords?.latitude && coords?.longitude) return `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`;
    }
    
    const openInMaps = () => {
        const link = createGoogleMapLink();
        console.log('opening in maps', link);
        if(link) {
            if(isNative){
                postNativeMessage('open-map', {coords, title: deviceName});
            }
            else window.open(link, '_blank')
        }
    };

    return (
        <Card sx={{ p: 2, borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 0, pb: '0 !important' }}>

                {/* Header Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box flex={1}>
                    <Typography variant="h6" fontWeight={600} lineHeight={1} >
                        {deviceName}
                    </Typography>
                    <Typography variant="caption">
                    {t(prefixString('report', segmentOf))} {t('sharedInfoTitle')}
                    </Typography>
                    </Box>
                    <Box>
                        <IconButton size="small" color={copied ? "success" : "primary"} onClick={handleCopy}>
                            {copied ? <CheckIcon fontSize="small" /> : <ContentPasteIcon fontSize="small" />}
                        </IconButton>
                        <IconButton size="small" color="secondary" onClick={openInMaps}>
                            <PinDropIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="quadrial" onClick={handleShare}>
                            <ShareIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={onClose}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>

                {/* Time Range */}
                <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', mb: 1.5 }}>
                    <Box sx={{ flex: 1, p: 1, borderRadius: 2, bgcolor: 'background.default' }}>
                        <Typography variant="caption" color="text.secondary">{t('reportStartTime')}</Typography>
                        <Typography variant="body2">{startTime.toLocaleTimeString()}</Typography>
                    </Box>

                    <ArrowForwardIcon
                        sx={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: 'background.paper',
                            borderRadius: '50%',
                            boxShadow: 2,
                            fontSize: '1.6rem',
                            p: 0.5,
                            zIndex: 1
                        }}
                    />

                    <Box sx={{ flex: 1, p: 1, borderRadius: 2, bgcolor: 'background.default', textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">{t('reportEndTime')}</Typography>
                        <Typography variant="body2">{endTime.toLocaleTimeString()}</Typography>
                    </Box>
                </Box>

                {/* Duration */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <QueryBuilderIcon color="success" sx={{ mr: 0.75 }} />
                        <Typography variant="body2" color="text.secondary">{t('reportDuration')}</Typography>
                    </Box>
                    <Typography variant="body2">{duration}</Typography>
                </Box>

                {/* Speed */}
                {speed && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <SpeedIcon sx={{ mr: 0.75 }} />
                            <Typography variant="body2" color="text.secondary">{t('reportSpeed')}</Typography>
                        </Box>
                        <Typography variant="body2">{speed}</Typography>
                    </Box>
                )}

                {/* Location */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <FmdGoodIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                        <Typography variant="body2">{location || t('positionNoAddress')}</Typography>
                    </Box>
                </Box>

            </CardContent>
        </Card>
    );
}
