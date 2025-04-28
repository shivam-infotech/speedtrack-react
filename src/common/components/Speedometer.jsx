import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "./LocalizationProvider";

// Example digital font - you can load a custom one via @font-face or link
const digitalFont = `"Tektur", monospace`;

const Speedometer = ({ speed }) => {
  const theme = useTheme();
  const t = useTranslation();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.background.default,
        color: "#111",
        padding: 1.5,
        borderRadius: 2,
        // boxShadow: 3,
        fontFamily: digitalFont,
      }}
    >
      {/* <AnimatePresence mode="wait">
        <motion.div
          key={speed}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.1 }}
        >
          <Typography variant="h5" lineHeight={1.2} sx={{ fontFamily: digitalFont }}>
            {Math.ceil(speed)}
          </Typography>
        </motion.div>
      </AnimatePresence>
      <Typography variant="caption" lineHeight={1} sx={{ fontFamily: digitalFont }}>
        {t('sharedKmh')}
      </Typography> */}
      <Typography variant="h5" lineHeight={1.2} sx={{ fontFamily: digitalFont }}>
        {Math.ceil(speed)}
      </Typography>
      <Typography variant="caption" lineHeight={1} sx={{ fontFamily: digitalFont }}>
        {t('sharedKmh')}
      </Typography>
    </Box>
  );
};

export default Speedometer;
