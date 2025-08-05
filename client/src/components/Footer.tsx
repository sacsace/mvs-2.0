import React from "react";
import { Box, Typography } from "@mui/material";

export default function Footer() {
  return (
    <Box position="fixed" bottom={16} left={0} width="100%" textAlign="center">
      <Typography variant="body2" color="textSecondary">
        powered by Minsub Ventures Private Limited
      </Typography>
    </Box>
  );
} 