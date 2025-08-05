import React from "react";
import { Box } from "@mui/material";

export default function Logo() {
  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
      gap: 1,
      width: 48,
      height: 32,
    }}>
      {[...Array(6)].map((_, index) => (
        <Box
          key={index}
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#1976d2',
          }}
        />
      ))}
    </Box>
  );
} 